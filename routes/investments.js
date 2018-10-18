const express = require('express');
const router = express.Router();
const axios = require('axios');
const async = require('async');
const _ = require('lodash');

const UserModel = require('../schemas/users');
const TransactionModel = require('../schemas/transactions');
const utils = require('../utils/utils');
const { decryptData } = require('../utils/crypto');
const {
  resError400,
  resSuccess200
} = require('../utils/responseHandler');

const {
  getTotalInvested,
  getTotalCoins,
  getBalance,
  getDifference,
  getPercentDifference,
  getTransactionDiff,
  getTransactionPercentDiff,
  getTransactionCurrentBalance,
  getTransactionLevel,
  getCoinPrice,
} = require('../utils/calc');

const {
  getExchangeRates
} = require('../utils/exchange')

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
  if (!(decodedData = utils.isValidJWT(jwt))) return resError400(res, constants.errors.EXPIRED_JWT);

  const sessionData = decryptData(decodedData.data);
  const sessionJSON = JSON.parse(sessionData);
  const userId = sessionJSON.id;

  return UserModel.findOne({ _id: userId }, (error, user) => {
    if (error) return resError400(res, constants.errors.INVALID_USER);

    const accessToken = user.coinbase.accessToken;
    const refreshToken = user.coinbase.refreshToken;

    const client = new Client({ accessToken, refreshToken });
    return client.getAccounts({}, (error, resp) => {
      if (error) return resSuccess400(res, constants.errors.COINBASE_GENERAL_ERROR);

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
              console.log("balance", balance);
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
          return resSuccess200(res, data);
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
  if (!(decodedData = utils.isValidJWT(jwt))) return resError400(res, constants.errors.EXPIRED_JWT);

  const sessionData = decryptData(decodedData.data);
  const sessionJSON = JSON.parse(sessionData);
  const userId = sessionJSON.id;

  UserModel.findOne({ _id: userId }, (error, user) => {
    if (error) return resError400(res, constants.errors.INVALID_USER);

    const accessToken = user.coinbase.accessToken;
    const refreshToken = user.coinbase.refreshToken;

    const client = new Client({ accessToken, refreshToken });
    return client.getAccounts({}, (err, resp) => {

      return async.map(resp, (account, cb) => {
        return account.getTransactions({}, (err, transResp) => cb(null, transResp));
      }, (err, results) => {

        // Do Calculations and create object if its a buy ONLY.
        return async.map(results, (trans, cb1) => {
          return async.map(trans, (t, cb2) => {

            if (t.type !== 'buy' || t.amount.currency === 'USD') return cb2();

            const exchangeId = t.id;
            const exchange = 'coinbase';

            // coin amounts
            const currency = t.amount.currency;
            const amountPurchased = t.amount.amount;

            // how much I bought the above amount for.
            const amount = t.native_amount.amount;
            const boughtAt = getCoinPrice(amount, amountPurchased);

            let lclCurrentBalance, lclDifference, lclPercentDiff;

            return getTransactionCurrentBalance(currency, amountPurchased)
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

                // Add to the DB.
                TransactionModel.findOneAndUpdate({
                  exchange,
                  exchangeId
                }, {
                  userId,
                  transactionDate: t.created_at,
                  nativeAmountBought: amount,
                  currency: currency,
                  currencyAmountBought: amountPurchased,
                  status: 'live',
                  currencyAmountBoughtAt: boughtAt,
                  earned: lclDifference,
                },  {upsert:true})
                  .then(() => {

                    return cb2(null, {
                      id: t.id,
                      type: t.type,
                      status: t.status,
                      currency: currency,
                      amount: amountPurchased,
                      nativeAmount: t.native_amount.amount,
                      createdAt: t.created_at,
                      currentBalance: lclCurrentBalance,
                      difference: lclDifference,
                      percentDifference: lclPercentDiff,
                      boughtAt,
                      level,
                      exchange
                    });

                  }).catch(error => console.log(error));
              })

          }, (err, data2) => {
            data2 = data2.filter(item => item != null);
            cb1(err, data2)
          });

        }, (err, data) => {
          data = _.flattenDeep(data);

          // Get the exchange rate
          return async.parallel({
            ETC: (cb) => getExchangeRates('ETC').then(rates => cb(null, rates)),
            BCH: (cb) => getExchangeRates('BCH').then(rates => cb(null, rates)),
            BTC: (cb) => getExchangeRates('BTC').then(rates => cb(null, rates)),
            LTC: (cb) => getExchangeRates('LTC').then(rates => cb(null, rates)),
            ETH: (cb) => getExchangeRates('ETH').then(rates => cb(null, rates)),
          }, (err, rates) => {

            data.forEach(d => {
              d.currentRate = rates[d.currency]
            });

            return resSuccess200(res, data)

          });
        });
      });
    });

  });
});


/**
 *  // Update the transaction locally.


 // You know this works for all transactions that were done within the system.
 // What about historical transactions?  Need to think about that.
 // This is were the price of the coin comes in.


 // Historical Transactions. (import)
 // Grab all the transactions
 // Grab all the sold transactions
 // For each


 // Transactions within the system
 // Send a signal to X to sell NOW
 // Get the current balance
 // Update the record to "sold" (this should hide the transaction)
 // If balance is in positive territory place into the earnings bucket.
 */
router.post('/sell', (req, res) => {
  const jwt = utils.getJWT(req);

  let decodedData;
  if (!(decodedData = utils.isValidJWT(jwt))) return resError400(res, constants.errors.EXPIRED_JWT);

  const sessionData = decryptData(decodedData.data);
  const sessionJSON = JSON.parse(sessionData);
  const userId = sessionJSON.id;

  const transactionId = req.param('transactionId');

  console.log(transactionId);

  let currencySoldAt = '';
  let soldDate = '';
  let soldAmount = '';

  return TransactionModel.findOne({
    _id: transactionId,
    status: 'live'
  }).then(result => {
    if (!result) return resSuccess200(res, {});

    console.log(result);

    // Get the current Rate
    // set to sold
    // set the date
    // for now we assume that we sell all.
    const currency = result.currency;
    const nativeCurrency = result.nativeCurrency;

    return getExchangeRates(currency, nativeCurrency)
      .then(rate => {
        return TransactionModel.update({ _id: transactionId }, { $set: {
          status: 'sold',
          currencySoldAt: rate,
          soldDate: new Date()
        }})
          .then(results => {
            if (results.nModified > 1) return resSuccess200(res, {});
            else return resSuccess200(res, {});
          })
          .catch(error => {
            console.log('error', error);
            return resSuccess200(res, data)
          })
      }).catch(error => {
        console.log('error', error);
        return resSuccess200(res, data);
      });
  });
});

// Get the bucket of positive investments that the site helped the user achieve.
// This closes the loop and demostrates how the system helps the user.  By helping the user track
// each transactoin I can help them track individual investments.
router.get('/earnings', (req, res) => {
  const jwt = utils.getJWT(req);

  let decodedData;
  if (!(decodedData = utils.isValidJWT(jwt))) return resError400(res, constants.errors.EXPIRED_JWT);

  const sessionData = decryptData(decodedData.data);
  const sessionJSON = JSON.parse(sessionData);
  const userId = sessionJSON.id;

  return TransactionModel.aggregate({
    $match: {
      userId,
      status: "sold",
    }
  }, {
    $group: {
      _id: "$currency",
      total: { $sum: "$earned" }
    }
  }).then(results => {
    return resSuccess200(res, results);
  }).catch(error => {
    console.log("error", error);
    return resSuccess200(res, [])
  });

});

// Unique ID - exchange id, exchange,

module.exports = router;