const Client = require('coinbase').Client;

const client = new Client({
  'apiKey': process.env.COINBASE_APIKEY,
  'apiSecret': process.env.COINBASE_APISECRET
});


/**
 * Get the total amount invested using
 * an accounts transactions logs.
 *
 * @param transactions
 * @returns {number}
 */
const getTotalInvested = (transactions) => {
  if (!transactions) return 0.00;
  let amount = 0;
  transactions.forEach(trans => {
    if (trans.type == 'buy' || trans.type == 'send') {
      amount += Number.parseFloat(trans.native_amount.amount);
    }
  })

  return amount;
};

/**
 * Get the total number of coin per account,
 * using account transactions.
 *
 * @param transactions
 * @returns {number}
 */
const getTotalCoins = (transactions) => {
  if (!transactions) return 0;
  let amount = 0;
  transactions.forEach(trans => {
    if (trans.type == 'buy' || trans.type == 'send') {
      amount += Number.parseFloat(trans.amount.amount);
    }
    if (trans.type == 'sell') {
      amount = amount - Number.parseFloat(trans.amount.amount);
    }
  });

  return amount;
};

/**
 * Get the balance for each account/coin
 * @param account
 */
const getBalance = (account,  cb) => {

  // Get the coins I've bought
  const currency = account.currency;

  return client.getExchangeRates({ currency }, function(err, rates) {
    const rate = rates.data.rates.USD;
    const totalCoins = getTotalCoins(account.transactions);

    const balance = rate*totalCoins;
    return cb(balance);
  });

};

/**
 * CurrentBalance - Balance Invested
 * When the current balance is below the invested amount it turns negative.
 *
 */
const getDifference = (account, cb) => {
  return getBalance(account, (currentBalance) => {
    const invested = getTotalInvested(account.transactions);
    const diff = currentBalance - invested
    return cb(diff)
  })
};

/**
 * This cant be right.  The % diff is not on the total invested but
 * more on each NEW buy transaction since the % rates differ.
 *
 * @param account
 * @param cb
 */
const getPercentDifference = (account, cb) => {
  getDifference(account, (increase) => {
    const perDiff = (increase / getTotalInvested(account.transactions)) * 100;
    return cb(perDiff);
  })
}

const getTransactionCurrentBalance = (currency, coinAmount) => {
  return new Promise((resolve) => {
    console.log(currency)
    return client.getExchangeRates({ currency }, (err, rates) => {
      console.log(rates)
      const rate = rates.data.rates.USD;

      console.log("rate", rate);

      const balance = rate*coinAmount;
      console.log("balance", balance);
      return resolve(balance);
    });
  })
};

const getTransactionPercentDiff = (currentCoinBalance, initInvestment) => {
  const diff = currentCoinBalance - initInvestment;
  const perDiff = (diff / initInvestment) * 100;
  return perDiff;
}

const getTransactionDiff = (currentCoinBalance, initInvestment) => {
  const diff = currentCoinBalance - initInvestment;
  return diff;
}


module.exports = {
  getTotalInvested,
  getTotalCoins,
  getBalance,
  getDifference,
  getPercentDifference,
  getTransactionCurrentBalance,
  getTransactionPercentDiff,
  getTransactionDiff
}

