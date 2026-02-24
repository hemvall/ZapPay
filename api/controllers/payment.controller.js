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

module.exports = {
  createPayment,
  listPayments,
  getPayment,
  getPaymentForPayer,
};
