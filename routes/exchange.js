const express = require('express');
const router = express.Router();
const axios = require('axios');
const async = require('async');
const _ = require('lodash');

const {
  resError400,
  resSuccess200
} = require('../utils/responseHandler');

const {
  getExchangeRates
} = require('../utils/exchange');

const Client = require('coinbase').Client;

router.get('/', (req, res) => {
  //const jwt = utils.getJWT(req);

  //let decodedData;
  //if (!(decodedData = utils.isValidJWT(jwt))) return resError400(res, constants.errors.EXPIRED_JWT);

  return getExchangeRates('BTC', 'USD').then(exchange => {
    console.log('exchange', exchange);
    return resSuccess200(res, {
      exchange,
      currency: 'USD',
      coin: 'BTC'
    })
  });

});

module.exports = router;