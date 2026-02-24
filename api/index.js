'use strict';
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();
const payer = require('./routes/Payer');
const merchant = require('./routes/merchant');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const errorHandler = require('./middlewares/errorHandler');
const { expireStalePayments } = require('./services/payment.service');

const app = express();
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/pay', payer);
app.use('/payments', merchant);

// error handler (last)
app.use(errorHandler);

const PORT = process.env.PORT || 4010;
app.listen(PORT, () => {
  console.log(`API listening on ${PORT}`);

  // Expire stale payments every 5 minutes
  setInterval(async () => {
    try {
      const count = await expireStalePayments();
      if (count > 0) console.log(`Expired ${count} stale payment(s)`);
    } catch (err) {
      console.error('Payment expiry error:', err.message);
    }
  }, 5 * 60 * 1000);
});
