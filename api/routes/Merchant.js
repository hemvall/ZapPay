const express = require('express');
const router = express.Router();
const controller = require('../controllers/payment.controller');

router.get('/', controller.listPayments);
router.post('/', controller.createPayment);
router.get('/address/:address', controller.getPaymentsByAddress);
router.get('/:id', controller.getPayment);

module.exports = router;