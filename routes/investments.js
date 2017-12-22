const express = require('express');
const router = express.Router();
const axios = require('axios');
const async = require('async');
const _ = require('lodash');

const {
  getTotalInvested,
  getTotalCoins,
  getBalance,
  getDifference,
  getPercentDifference,
  getTransactionDiff,
  getTransactionPercentDiff,
  getTransactionCurrentBalance
} = require('../utils/calc');

const Client = require('coinbase').Client;

const client = new Client({
  'apiKey': process.env.COINBASE_APIKEY,
  'apiSecret': process.env.COINBASE_APISECRET
});


/**
 * Portfolio Overview
 * Gets an aggregate calcs.
 *
 */
router.get('/overview', (req, res) => {
  // Check cache. TTL - 5 minutes
  return client.getAccounts({}, (err, resp) => {
      if (err) return res.json({ data: [] });

      //Foreach account get the transactions for purchasing more X coin
      return async.map(resp, (account, cb) => {
        account.getTransactions({}, (err, transResp) => {
          if (err) return cb(null);

          const data = {
            id: account.id,
            name: account.name,
            currency: account.currency,
            coinBalance: account.balance,
            nativeBalance: account.native_balance,
            transactions: transResp
          };

          cb(null, data);
        });
      }, (err, results) => {

        // Do Calculations
        async.map(results, (account, cb) => {
          const currency = account.currency;
          const transactions = account.transactions || [];
          let lclBalance, lclDiff, lclPerDiff, lclTotalInvested;

           return getBalance(currency, transactions)
             .then(balance => {
               lclBalance = balance;
               return getDifference(currency, transactions);
             })
             .then(difference => {
               lclDiff = difference;
               return getPercentDifference(currency, transactions)
             })
             .then((percentDifference) => {
               lclPerDiff = percentDifference;
               return getTotalInvested(transactions)
             })
             .then((totalInvested) => {
               lclTotalInvested = totalInvested;
               return getTotalCoins(transactions);
             })
             .then(totalCoins => {
               const investment = {
                 currency: currency,
                 totalInvested: lclTotalInvested,
                 totalCoins: totalCoins,
                 balance: lclBalance,
                 difference: lclDiff,
                 percentDifference: lclPerDiff
               };

               return cb(null, investment);
             });

        }, (err, data) => {
          return res.json(data || {});
        });
      });
    })
});

// This might be transactions instead of investments.
router.get('/list', (req, res) => {
  return client.getAccounts({}, (err, resp) => {
    //Foreach account get the transactions for purchasing more X coin
    return async.map(resp, (account, cb) => {
      return account.getTransactions({}, (err, transResp) => cb(null, transResp));
    }, (err, results) => {

      // Do Calculations and create object
      async.map(results, (trans, cb1) => {
        async.map(trans, (t, cb2) => {

          if (t.type !== 'buy') return cb2();
          getTransactionCurrentBalance(t.amount.currency, t.amount.amount)
            .then(curentBalance => {
              cb2(null, {
                id: t.id,
                type: t.type,
                status: t.status,
                currency: t.amount.currency,
                amount: t.amount.amount,
                nativeAmount: t.native_amount.amount,
                createdAt: t.created_at,
                currentBalance: curentBalance,
                difference: getTransactionDiff(curentBalance, t.native_amount.amount),
                percentDifference: getTransactionPercentDiff(curentBalance, t.native_amount.amount)
              });
            })
        }, (err, data2) => {
          data2 = data2.filter(item => item != null);
          cb1(err, data2)
        });

      }, (err, data) => {
        data = _.flattenDeep(data);
        return res.json(data || {});
      });
    });
  });
});


module.exports = router;


// Get accounts
// Foreach account get the transactions for purchasing more X coin
// For each transaction
//  Get The total invested. (Done)
//  Get the total coins I own (Done)
//  Get the current $$ * total coins bought. (Done)
//  calculate the gain/loss (Aggregate)
//  calculate the profit (Aggregate)