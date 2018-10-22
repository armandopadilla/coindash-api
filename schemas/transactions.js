const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  exchangeId: String,  // Id from coinbase or other exchange
  exchange: String, // Exchange 'coinbase', etc, etc
  transactionDate: Date, // When the transaction took place. Taken from exchange.
  nativeCurrency: String, // USD or other
  nativeAmountBought: Number, // How much USD was spent on this transaction
  currency: String, // Bitcoing, Bitcoing Classic, etc.
  currencyAmountBought: Number, // How much bitcoin was purchased in this transaction
  status: String, // 'sold', '' = live
  currencyAmountBoughtAt: Number, // The price of bitcoin at the time of purchase
  currencySoldAt: Number, // The price of bitcoing at the time of selling
  soldDate: Date, // When the user sold this investment transaction
  earned: Number, // How much did the user Earn in this transaction
  userId: String // Who this transaction belongs to within my system.
});

const model = mongoose.model('Transaction', transactionSchema);

module.exports = model;