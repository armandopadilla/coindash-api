const Client = require('coinbase').Client;

const client = new Client({
  'apiKey': process.env.COINBASE_APIKEY,
  'apiSecret': process.env.COINBASE_APISECRET
});


const getExchangeRates = (currency, nativeCurrency) =>
  new Promise((resolve, reject) => {

  console.log("currency", currency)
    nativeCurrency = (nativeCurrency) ? nativeCurrency : 'USD';

    // Check cache - TTL = 3 minute
    return client.getExchangeRates({ currency }, (err, rates) => {
      console.error(err)
      console.log(rates.data)
      const rate = rates.data.rates[nativeCurrency];
      return resolve(rate);
    });
});


module.exports = {
  getExchangeRates
}