const getExchangeRates = require('./exchange').getExchangeRates;
const UserModel = require('../schemas/users');


/**
 * Get the total amount invested using
 * an account's transactions logs.
 *
 * @param transactions
 * @returns {number}
 */
const getTotalInvested = (transactions) => new Promise((resolve, reject) => {
  if (!transactions) return resolve(0.00);

  let amount = 0;
  transactions.forEach(trans => {
    if (trans.type == 'buy' || trans.type == 'send')
      amount += Number.parseFloat(trans.native_amount.amount);
  });

  return resolve(amount);
});


/**
 * Get the total number of coin per the user has,
 * using an account's transactions.  Should already
 * be filtered by the coin (currency) type.
 *
 * @param transactions
 * @returns {number}
 */
const getTotalCoins = (transactions) => new Promise((resolve, reject) => {
  if (!transactions) return resolve(0);

  let amount = 0;
  transactions.forEach(trans => {
    if (trans.type == 'buy' || trans.type == 'send') {
      amount += Number.parseFloat(trans.amount.amount);
    }
    if (trans.type == 'sell') {
      amount = amount - Number.parseFloat(trans.amount.amount);
    }
  });

  return resolve(amount);
});


/**
 * Get the balance for each account/coin
 *
 * @param account
 * @return balance In Native Currency (Whatever the usr has set it to)
 */
const getBalance = (currency, transactions) => new Promise((resolve, reject) => {

  if (!transactions.length) return resolve(0);

  let lclRate;

  return getExchangeRates(currency)
    .then(rate => (lclRate = rate))
    .then(() => getTotalCoins(transactions))
    .then(totalCoins => {
      const balance = lclRate * totalCoins;
      return resolve(balance);
    })
    .catch(err => {
      console.error(err);
      return resolve(0);
    });
});


/**
 * Get the difference. CurrentBalance - Balance Invested
 *
 * @param account
 */
const getDifference = (currency, transactions) => new Promise((resolve, reject) => {
  if (!transactions.length) return resolve(0);

  let lclCurrentBalance;

  return getBalance(currency, transactions)
    .then(currentBalance => {
      lclCurrentBalance = currentBalance;
      return getTotalInvested(transactions)
    })
    .then(totalnvested => {
      const diff = lclCurrentBalance - totalnvested;
      return resolve(diff);
    })
    .catch(err => {
      console.error(err);
      return resolve(0);
    })
});


/**
 * Global percent difference on what the user has in the portfolio
 * and how much its made.
 *
 * @param account
 * @param cb
 */
const getPercentDifference = (currency, transactions) => new Promise((resolve, reject) => {
  if (!transactions.length) return resolve(0);

  let lclDifference;

  return getDifference(currency, transactions)
    .then((difference) => {
      lclDifference = difference;
      return getTotalInvested(transactions)
    })
    .then((totalInvested) => {
      const perDiff = (lclDifference / totalInvested) * 100;
      return resolve(perDiff);
    })
    .catch(err => {
      console.log(err);
      return resolve(0);
    })
});

/**
 * Get the current balance for a single transaction.
 *
 * @param currency Which crypto currency is used.
 * @param coinAmount How much crypto the user holds for this currency.
 */
const getTransactionCurrentBalance = (currency, coinAmount) =>
  new Promise((resolve, reject) => {
    return getExchangeRates(currency)
      .then(rate => {
        const balance = rate * coinAmount;
        return resolve(balance);
      })
      .catch(err => {
        console.error(err);
        return resolve(0);
      });
  });


/**
 * Get the percent difference for a single transaction.
 *
 * @param currentCoinBalance
 * @param initInvestment
 */
const getTransactionPercentDiff = (currentCoinBalance, initInvestment) =>
  new Promise((resolve, reject) => {
    const diff = currentCoinBalance - initInvestment;
    const perDiff = (diff / initInvestment) * 100;

    return resolve(perDiff);
  });


/**
 * Calculate the difference for 1 transaction.
 *
 * @param currentCoinBalance
 * @param initInvestment
 * @returns {Promise}
 */
const getTransactionDiff = (currentCoinBalance, initInvestment) =>
  new Promise((resolve, reject) => resolve(currentCoinBalance - initInvestment));


/**
 * Get the warning level for a specific transaction.
 *
 * @param percentDiff
 */
const getTransactionLevel = (percentDiff) => new Promise((resolve, reject) => {
  UserModel.findOne({firstName: 'Armando'}, (err, data) => {
    const danger = data.levels.danger;
    const onTrack = data.levels.onTrack;

    let level = 'warning';
    if (percentDiff >= onTrack) level = 'onTrack'
    if (percentDiff <= danger) level = 'danger';

    return resolve(level);
  })
});

module.exports = {
  getTotalInvested,
  getTotalCoins,
  getBalance,
  getDifference,
  getPercentDifference,
  getTransactionCurrentBalance,
  getTransactionPercentDiff,
  getTransactionDiff,
  getTransactionLevel
};

