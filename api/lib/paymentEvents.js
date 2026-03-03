const { EventEmitter } = require('events');

const paymentEmitter = new EventEmitter();
paymentEmitter.setMaxListeners(100);

function emitPaymentUpdate(payment) {
  paymentEmitter.emit('payment.updated', payment);
}

module.exports = { paymentEmitter, emitPaymentUpdate };
