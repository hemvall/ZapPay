const paymentService = require('../services/payment.service');

const getPayment = (req, res) => {
  const result = paymentService.getPayment(req.params.id);
  res.json(result);
};

const createPayment = (req, res) => {
  const result = paymentService.createPayment(req.body);
  res.json(result);
};

const listPayments = (req, res) => {
  const result = paymentService.listPayments();
  res.json(result);
};

const getPaymentForPayer = (req, res) => {
  const result = paymentService.getPaymentForPayer(req.params.id);
  res.json(result);
};

module.exports = {
  createPayment,
  listPayments,
  getPayment,
  getPaymentForPayer,
};