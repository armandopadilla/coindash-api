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
} = require('../../utils/calc');

const Client = require('coinbase').Client;

const client = new Client({
  'apiKey': process.env.COINBASE_APIKEY,
  'apiSecret': process.env.COINBASE_APISECRET
});

router.get('/overview', (req, res) => {
  //Get the accounts - each coin type is an account.
  return client.getAccounts({}, (err, resp) => {
    if (err) {
      console.log(err)
      return res.json({ err });
    }

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
        getBalance(account, (balance) => {
          getDifference(account, (difference) => {
            getPercentDifference(account, (perDiff) => {
              const investment = {
                currency: account.currency,
                totalInvested: getTotalInvested(account.transactions),
                totalCoins: getTotalCoins(account.transactions),
                balance,
                difference,
                percentDifference: perDiff
              };
              return cb(err, investment);
            })
          })
        });
      }, (err, data) => {
        return res.json(data || {});
      });
    });
  });
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