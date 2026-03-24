const prisma = require('../lib/prisma');
const { getChainAdapter } = require('../chain/chain.factory');
const { computePlatformFee } = require('../chain/fees');
const { emitPaymentUpdate } = require('../lib/paymentEvents');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PAYMENT_TTL_MINUTES = Number(process.env.PAYMENT_TTL_MINUTES || 30);

async function createPayment({ amount, token, network, recipientAddress, label, merchantName }) {
  const expiresAt = new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000);
  const payment = await prisma.payment.create({
    data: { amount, token, network, recipientAddress, label, merchantName, expiresAt },
  });

  const paymentUrl = `${FRONTEND_URL}/pay/${payment.id}`;
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(paymentUrl)}&size=200x200`;
  const estimatedFees = String(computePlatformFee(parseFloat(amount), network));

  return {
    paymentId: payment.id,
    paymentUrl,
    qrCode,
    estimatedFees,
  };
}

async function getPayment(id) {
  return prisma.payment.findUnique({ where: { id } });
}

async function getPaymentForPayer(id) {
  return prisma.payment.findUnique({ where: { id } });
}

async function listPayments() {
  return prisma.payment.findMany({ orderBy: { createdAt: 'desc' } });
}

async function getPaymentsByAddress(address, { status } = {}) {
  const where = {
    OR: [
      { recipientAddress: address },
      { payer: address },
    ],
  };
  if (status) {
    where.status = status;
  }
  return prisma.payment.findMany({ where, orderBy: { createdAt: 'desc' } });
}

async function updatePayment(id, patch) {
  const existing = await prisma.payment.findUnique({ where: { id } });
  if (!existing) return null;
  const updated = await prisma.payment.update({ where: { id }, data: patch });
  emitPaymentUpdate(updated);
  return updated;
}

/**
 * Payer submits a txHash after sending the on-chain transaction.
 * 1. Update status to PENDING
 * 2. Wait for on-chain confirmation
 * 3. Update status to CONFIRMED or FAILED
 */
async function submitTransaction(id, txHash, payerAddress) {
  // Ensure payment exists and is in CREATED state
  const payment = await prisma.payment.findUnique({ where: { id } });
  if (!payment) throw Object.assign(new Error('Payment not found'), { status: 404 });
  if (payment.status !== 'CREATED') {
    throw Object.assign(
      new Error(`Payment is already ${payment.status}, cannot submit transaction`),
      { status: 409 }
    );
  }

  // Mark as PENDING with the txHash
  await prisma.payment.update({
    where: { id, status: 'CREATED' },
    data: { txHash, payer: payerAddress, status: 'PENDING' },
  });

  // Start on-chain confirmation (MVP: blocking wait)
  try {
    const adapter = getChainAdapter(payment.network);
    const receipt = await adapter.waitForTransaction(txHash);

    if (receipt.status === 'success') {
      await prisma.payment.update({
        where: { id },
        data: { status: 'CONFIRMED' },
      });
      return { status: 'CONFIRMED', txHash: receipt.txHash };
    } else {
      await prisma.payment.update({
        where: { id },
        data: { status: 'FAILED' },
      });
      return { status: 'FAILED', txHash: receipt.txHash };
    }
  } catch (err) {
    // If confirmation fails (timeout, RPC error), keep as PENDING
    console.error(`Confirmation failed for payment ${id}:`, err.message);
    return { status: 'PENDING', txHash, error: 'Confirmation in progress' };
  }
}

/**
 * Expire CREATED payments older than TTL.
 */
async function expireStalePayments() {
  const cutoff = new Date(Date.now() - PAYMENT_TTL_MINUTES * 60 * 1000);
  const result = await prisma.payment.updateMany({
    where: {
      status: 'CREATED',
      createdAt: { lt: cutoff },
    },
    data: { status: 'EXPIRED' },
  });
  return result.count;
}

module.exports = {
  createPayment,
  getPayment,
  getPaymentForPayer,
  listPayments,
  getPaymentsByAddress,
  updatePayment,
  submitTransaction,
  expireStalePayments,
};
