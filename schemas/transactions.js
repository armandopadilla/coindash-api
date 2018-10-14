const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
  exchangeId: String,
  exchange: String,
  transactionDate: Date,
  nativeCurrency: String,
  nativeAmountBought: Number,
  currency: String,
  currencyAmountBought: Number,
  status: String,
  currencyAmountBoughtAt: Number,
  currencySoldAt: Number,
  soldDate: Date,
  earned: Number,
  userId: String
});

const model = mongoose.model('Transaction', transactionSchema);

module.exports = model;