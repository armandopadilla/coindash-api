require('dotenv').config()

const express = require('express');

const investments = require('./routes/investments')
const settings = require('./routes/settings')

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use('/investments', investments);
app.use('/settings', settings);

app.listen(3000, () => {
  console.log("Lets roll on port 3000!......");
});

// API
  // init - will pull all the data we need to play with on log in
  // might want to make this a pub/sub api