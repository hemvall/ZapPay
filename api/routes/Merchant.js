const express = require('express');
const router = express.Router();
const controller = require('../controllers/payment.controller');

router.get('/', controller.listPayments);
router.post('/', controller.createPayment);
router.patch('/:id', controller.submitTransaction);
router.get('/address/:address/stream', controller.streamPaymentsByAddress);
router.get('/address/:address', controller.getPaymentsByAddress);
router.get('/:id', controller.getPayment);
router.patch('/:id', controller.updatePayment);

module.exports = router;