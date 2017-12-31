require('dotenv').config()

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const serverless = require('serverless-http');

mongoose.connect('mongodb://'+process.env.MONGO_HOST+'/'+process.env.MONGO_DB);
const db = mongoose.connection;
db.on('open', () => {
  console.log('DB Good to go');
});

db.on('error', (err) => {
  console.log("ERROR");
  console.log(err);
})

const investments = require('./routes/investments');
const settings = require('./routes/settings');
const index = require('./routes/index');
const linkAccounts = require('./routes/linkaccount');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

app.use('/investments', investments);
app.use('/settings', settings);
app.use('/', index);
app.use('/link-account', linkAccounts);

app.get('/health', (req, res) => {
  const axios = require('axios');
  return axios.get('http://www.google.com').then(resp => {
    let status = 'FAILED';
    if (resp.status === 200) status = 'OK';
    res.json({ internetAccess: status });
  }).catch(err => console.error(err));
})

//module.exports.handler = serverless(app);


app.listen(3000, () => {
  console.log("Lets roll on port 3000!......");
});


// API
  // init - will pull all the data we need to play with on log in
  // might want to make this a pub/sub api