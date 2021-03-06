const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  cellPhone: String,
  levels: Schema.Types.Mixed,
  coinbase: Schema.Types.Mixed
});

const model = mongoose.model('User', userSchema);

module.exports = model;