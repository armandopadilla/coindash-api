const Client = require('coinbase').Client;

const client = new Client({
  'apiKey': process.env.COINBASE_CLIENT_ID,
  'apiSecret': process.env.COINBASE_CLIENT_SECRET
});


const getExchangeRates = (currency, nativeCurrency) =>
  new Promise((resolve, reject) => {

    nativeCurrency = (nativeCurrency) ? nativeCurrency : 'USD';

    // Check cache - TTL = 3 minute
    return client.getExchangeRates({ currency }, (err, rates) => {
      const rate = rates.data.rates[nativeCurrency];
      return resolve(rate);
    });
});


module.exports = {
  getExchangeRates
}