const prisma = require('../lib/prisma');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Simple fee estimates per network (in USD)
const NETWORK_FEES = {
  ethereum: '0.23',
  polygon: '0.01',
  arbitrum: '0.03',
  optimism: '0.04',
  base: '0.02',
};

async function createPayment({ amount, token, network, recipientAddress, label, merchantName }) {
  const payment = await prisma.payment.create({
    data: { amount, token, network, recipientAddress, label, merchantName },
  });

  const paymentUrl = `${FRONTEND_URL}/pay/${payment.id}`;
  const qrCode = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(paymentUrl)}&size=200x200`;
  const estimatedFees = NETWORK_FEES[network.toLowerCase()] || '0.00';

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
  return prisma.payment.update({ where: { id }, data: patch });
}

module.exports = {
  createPayment,
  getPayment,
  getPaymentForPayer,
  listPayments,
  getPaymentsByAddress,
  updatePayment,
};
