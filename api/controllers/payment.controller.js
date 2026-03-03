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

const submitTransaction = async (req, res, next) => {
  try {
    const { txHash, payer } = req.body;

    if (!txHash) return res.status(400).json({ error: 'Missing required field: txHash' });
    if (!payer) return res.status(400).json({ error: 'Missing required field: payer' });

    const result = await paymentService.submitTransaction(req.params.id, txHash, payer);
    res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
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

module.exports = {
  createPayment,
  listPayments,
  getPayment,
  updatePayment,
  getPaymentForPayer,
  submitTransaction,
  getPaymentsByAddress,
  streamPaymentsByAddress,
};
