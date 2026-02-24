const paymentService = require('../services/payment.service');

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

const submitTransaction = async (req, res, next) => {
  try {
    const { txHash, payer } = req.body;

    if (!txHash) return res.status(400).json({ error: 'Missing required field: txHash' });
    if (!payer) return res.status(400).json({ error: 'Missing required field: payer' });

    const result = await paymentService.submitTransaction(req.params.id, txHash, payer);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    next(err);
  }
};

module.exports = {
  createPayment,
  listPayments,
  getPayment,
  getPaymentForPayer,
  submitTransaction,
};
