const express = require('express');
const router = express.Router();
const controller = require('../controllers/payment.controller');

// Payer page / recap + deep link
router.get('/pay/:id', controller.getPaymentForPayer);

module.exports = router;