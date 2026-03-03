const paymentService = require('../services/payment.service');
const { paymentEmitter } = require('../lib/paymentEvents');

const createPayment = async (req, res, next) => {
  try {
    const { amount, token, network, recipientAddress, label, merchantName } = req.body;

    const missing = [];
    if (!amount) missing.push('amount');
    if (!token) missing.push('token');
    if (!network) missing.push('network');
    if (!recipientAddress) missing.push('recipientAddress');

    if (missing.length > 0) {
      return res.status(400).json({
        error: `Missing required fields: ${missing.join(', ')}`,
      });
    }

    const result = await paymentService.createPayment({
      amount,
      token,
      network,
      recipientAddress,
      label,
      merchantName,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const result = await paymentService.getPayment(req.params.id);
    if (!result) return res.status(404).json({ error: 'Payment not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const listPayments = async (req, res, next) => {
  try {
    const result = await paymentService.listPayments();
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getPaymentForPayer = async (req, res, next) => {
  try {
    const result = await paymentService.getPaymentForPayer(req.params.id);
    if (!result) return res.status(404).json({ error: 'Payment not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getPaymentsByAddress = async (req, res, next) => {
  try {
    const { address } = req.params;
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    const { status } = req.query;
    const result = await paymentService.getPaymentsByAddress(address, { status });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const updatePayment = async (req, res, next) => {
  try {
    const { status, txHash, payer } = req.body;

    if (!status && !txHash && !payer) {
      return res.status(400).json({ error: 'No valid fields to update (status, txHash, payer)' });
    }

    const patch = {};
    if (status) patch.status = status;
    if (txHash) patch.txHash = txHash;
    if (payer) patch.payer = payer;

    const result = await paymentService.updatePayment(req.params.id, patch);
    if (!result) return res.status(404).json({ error: 'Payment not found' });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const streamPaymentsByAddress = (req, res) => {
  const { address } = req.params;
  if (!address || !address.startsWith('0x') || address.length !== 42) {
    return res.status(400).json({ error: 'Invalid Ethereum address' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();

  const onPaymentUpdate = (payment) => {
    const addr = address.toLowerCase();
    if (
      payment.recipientAddress?.toLowerCase() === addr ||
      payment.payer?.toLowerCase() === addr
    ) {
      res.write(`event: payment.status\ndata: ${JSON.stringify(payment)}\n\n`);
    }
  };

  paymentEmitter.on('payment.updated', onPaymentUpdate);

  req.on('close', () => {
    paymentEmitter.off('payment.updated', onPaymentUpdate);
  });
};

module.exports = {
  createPayment,
  listPayments,
  getPayment,
  updatePayment,
  getPaymentForPayer,
  getPaymentsByAddress,
  streamPaymentsByAddress,
};
