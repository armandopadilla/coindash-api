const express = require('express');
const router = express.Router();

const {
  resSuccess200
} = require('../utils/responseHandler');

const {
  getExchangeRates
} = require('../utils/exchange');

const Client = require('coinbase').Client;

/**
 * Fetch the exchange rate for a specific coin.
 */
router.get('/', (req, res) => getExchangeRates('BTC', 'USD').then(exchange => {
  return resSuccess200(res, {
    exchange,
    currency: 'USD',
    coin: 'BTC'
  })
}));

module.exports = router;