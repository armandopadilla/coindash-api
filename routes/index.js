const express = require('express');
const router = express.Router();
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const qs = require('qs');
const axios = require('axios');

const UserModel = require('../schemas/users');

const SECRET = 'REPLATETHISSOON';

router.post('/signup', (req, res) => {

  const email = req.body.email || '';
  const password = req.body.password || '';
  const repassword = req.body.repassword || '';

  // Validate
  const errors = [];
  if (!validator.isEmail(email)) {
    errors.push({ message: 'Email is not valid.'});
  }
  if (password.length < 6 || password.length > 20) {
    errors.push({ message: 'Password must be between 6 and 20 char in length. '});
  }
  if (password != repassword) {
    errors.push({ message: 'Passwords do not match.'});
  }

  if (errors.length) return res.json({ status: 'FAILED', errors });

  // Check if the user already exists
  return UserModel.findOne({ email }).then(user => {
    if (user) return res.json({
      status: 'FAILED',
      errors: [{message: 'Please try another email. Account already system'}]
    });

    // Save
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const newUser = new UserModel({
      email,
      password: hashedPassword,
      levels: {
        onTrack: 10,
        danger: 1
      }
    });
    newUser.save((err) => {
      if (err) console.error(err);
      return res.json({
        status: 'OK',
        data: newUser
      });
    });
  });

});


router.post('/login', (req, res) => {
  const email = req.body.email || '';
  const password = req.body.password || '';

  if (!email.trim().length && password.trim().length) return res.json({
    status: 'FAILED',
    errors: [{ message: 'Email and/or Password invalid.'}]
  });


  UserModel.findOne({ email }, (err, user) => {
    if (err) res.json({
      status: 'FAILED',
      errors: [{ message: 'System encountered a problem.  Try again later.'}]
    });

    if (!user) return res.json({
      status: 'FAILED',
      errors: [{ message: 'Email and/or Password invalid.'}]
    });

    // Check the password
    console.log(user);
    if(!bcrypt.compareSync(password, user.password)) {
      return res.json({
        status: 'FAILED',
        errors: [{ message: 'Email and/or Password invalid.'}]
      });
    }

    // All good.
    // TODO - Encrypt the token before launch.
    const token = jwt.sign({
      exp: Math.floor(Date.now() / 1000) + (60 * 60),
      data: { email }
    }, SECRET);

    // Check if the user should be sent to coinbase or not.
    let toCoinbase = false;
    // If not set, force he user to auth with Coinbase.
    if (!user.coinbase) {

      //https://www.coinbase.com/oauth/authorize?client_id=d4acaf682461752e000cf1819b2fc1ae70e0dee216c7f925a514464763e22d73&redirect_uri=http%3A%2F%2Fcrypto-manager-web.s3-website-us-west-1.amazonaws.com%2Flink-account&response_type=code&scope=wallet%3Auser%3Aread'
      const coinbaseURL = "https://www.coinbase.com/oauth/authorize"
      const clientId = 'd4acaf682461752e000cf1819b2fc1ae70e0dee216c7f925a514464763e22d73';
      const state = token;
      const redirectURL = "http://crypto-manager-web.s3-website-us-west-1.amazonaws.com/link-account";

      return res.json({
        status: 'OK',
        token,
        toCoinbase: true,
        redirectURL: coinbaseURL+
        "?client_id="+ clientId+
        "&redirect_uri="+redirectURL+
        "&state="+state+
        "&response_type=code"+
        "&scope=wallet:accounts:read,wallet:transactions:read"+
        "&account=all"
      });
    }
    // If it is set then refresh the token.
    else if(user.coinbase) {
      // Refresh the token
      const params = 'https://api.coinbase.com/oauth/token?'+qs.stringify({
          grant_type: 'refresh_token',
          refresh_token: user.coinbase.refreshToken,
          client_id: process.env.COINBASE_CLIENT_ID,
          client_secret: process.env.COINBASE_CLIENT_SECRET,
          score: 'wallet:accounts:read,wallet:transactions:read',
          account: 'all'
        });

      return axios.post(params).then(resp => {

        const accessToken = resp.data.access_token;
        const tokenType = resp.data.token_type;
        const expiresIn = resp.data.expires_in;
        const refreshToken = resp.data.refresh_token;
        const scope = resp.data.scope;

        const updateData = { coinbase: {
          accessToken,
          expiresIn,
          refreshToken,
          scope,
          tokenType,
          updatedDate: new Date()
        }
        };

        // Grab the accessToken and refreshToken and save to mongo
        return UserModel.update({ email }, updateData, (err, user) => {
            if (err) {
              console.error(err);
              return res.json({
                status: 'FAILED',
                errors: [ { message: 'Invalid user.'} ]
              });
            }

            return res.json({
              status: 'OK',
              toCoinbase,
              token
            })
          });

      });
    }
    // Why do we need this?
    else {
      return res.json({
        status: 'OK',
        token,
        toCoinbase,
        redirectURL: ''
      });
    }

  })

});


module.exports = router;