const express = require('express');
const router = express.Router();
const axios = require('axios');
const async = require('async');
const _ = require('lodash');

const UserModel = require('../schemas/users');
const utils = require('../utils/utils');

const {
  getTotalInvested,
  getTotalCoins,
  getBalance,
  getDifference,
  getPercentDifference,
  getTransactionDiff,
  getTransactionPercentDiff,
  getTransactionCurrentBalance,
  getTransactionLevel
} = require('../utils/calc');

const Client = require('coinbase').Client;

/**
 * Portfolio Overview
 * Gets an aggregate calcs.
 *
 * // Get accounts
 // Foreach account get the transactions for purchasing more X coin
 // For each transaction
 //  Get The total invested. (Done)
 //  Get the total coins I own (Done)
 //  Get the current $$ * total coins bought. (Done)
 //  calculate the gain/loss (Aggregate)
 //  calculate the profit (Aggregate)
 *
 */
router.get('/overview', (req, res) => {
  const jwt = utils.getJWT(req);

  let decodedData;
  if (!(decodedData = utils.isValidJWT(jwt))) return res.json({
    status: 'RELOGIN_NEEDED'
  });

  const email = decodedData.data.email;
  return UserModel.findOne({ email }, (err, user) => {
    if (err) return res.json({
      status: 'FAILED',
      errors: [{ message: 'User not found.'}]
    });

    const accessToken = user.coinbase.accessToken;
    const refreshToken = user.coinbase.refreshToken;
    const userId = user.id;

    const client = new Client({accessToken, refreshToken});
    return client.getAccounts({}, (err, resp) => {
      if (err) return res.json({ data: [] });

      //Foreach account get the transactions for purchasing more X coin
      return async.map(resp, (account, cb) => {
        account.getTransactions({}, (err, transResp) => {
          if (err) return cb(null);

          const data = {
            id: account.id,
            name: account.name,
            currency: account.currency.code,
            coinBalance: account.balance,
            nativeBalance: account.native_balance,
            transactions: transResp
          };

          cb(null, data);
        });
      }, (err, results) => {

        // Do Calculations
        return async.map(results, (account, cb) => {
          const currency = account.currency;
          const transactions = account.transactions || [];
          let lclBalance, lclDiff, lclPerDiff, lclTotalInvested, lclTotalCoins;

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
              lclTotalCoins = totalCoins;
              return getTransactionLevel(userId, lclPerDiff);
            })
            .then(level => {
              const investment = {
                currency: currency,
                totalInvested: lclTotalInvested,
                totalCoins: lclTotalCoins,
                balance: lclBalance,
                difference: lclDiff,
                percentDifference: lclPerDiff,
                level
              };

              return cb(null, investment);
            });

        }, (err, data) => {
          return res.json(data || {});
        });
      });
    })
  });
});



/**
 * This might be transactions instead of investments.
 */
router.get('/list', (req, res) => {
  const jwt = utils.getJWT(req);

  let decodedData;
  if (!(decodedData = utils.isValidJWT(jwt))) return res.json({
    status: 'RELOGIN_NEEDED'
  });

  const email = decodedData.data.email;

  UserModel.findOne({ email }, (err, user) => {
    if (err) return res.json({
      status: 'FAILED',
      errors: [{ message: 'User not found.'}]
    });

    const accessToken = user.coinbase.accessToken;
    const refreshToken = user.coinbase.refreshToken;
    const userId = user.id;

    const client = new Client({ accessToken, refreshToken });
    return client.getAccounts({}, (err, resp) => {

      return async.map(resp, (account, cb) => {
        return account.getTransactions({}, (err, transResp) => cb(null, transResp));
      }, (err, results) => {

        // Do Calculations and create object if its a buy ONLY.
        return async.map(results, (trans, cb1) => {
          return async.map(trans, (t, cb2) => {

            if (t.type !== 'buy') return cb2();
            const currency = t.amount.currency;
            const amount = t.amount.amount;
            let lclCurrentBalance, lclDifference, lclPercentDiff;

            return getTransactionCurrentBalance(currency, amount)
              .then(currentBalance => {
                lclCurrentBalance = currentBalance;
                return getTransactionDiff(currentBalance, t.native_amount.amount)
              })
              .then((difference) => {
                lclDifference = difference;
                return getTransactionPercentDiff(lclCurrentBalance, t.native_amount.amount)
              })
              .then(percentDiff => {
                lclPercentDiff = percentDiff;
                return getTransactionLevel(userId, lclPercentDiff)
              })
              .then(level => {
                return cb2(null, {
                  id: t.id,
                  type: t.type,
                  status: t.status,
                  currency: currency,
                  amount: amount,
                  nativeAmount: t.native_amount.amount,
                  createdAt: t.created_at,
                  currentBalance: lclCurrentBalance,
                  difference: lclDifference,
                  percentDifference: lclPercentDiff,
                  level
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
});


module.exports = router;