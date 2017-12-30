const express = require('express');
const router = express.Router();
const axios = require('axios');
const qs = require('qs');
const jwt = require('jsonwebtoken');

const UserModel = require('../schemas/users');
const utils = require('../utils/utils');

router.post('/coinbase', (req, res) => {
  const code = req.body.code || '';
  const state = req.body.state || '';

  // Decrypt the state (contains the id of the user)
  return jwt.verify(state, "REPLATETHISSOON", (err, decoded) => {
    if (err) return res.json({ status: 'FAILED', errors: [{ message: err.message }] });

    const email = decoded.data.email;

    // Get the access token
    const params = 'https://api.coinbase.com/oauth/token?'+qs.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.COINBASE_CLIENT_ID,
        client_secret: process.env.COINBASE_CLIENT_SECRET,
        redirect_uri: 'http://crypto-manager-web.s3-website-us-west-1.amazonaws.com/link-account',
        score: 'wallet:accounts:read,wallet:transactions:read',
        account: 'all'
      });

    return axios.post(params).
      then(resp => {
      const accessToken = resp.data.access_token;
      const tokenType = resp.data.token_type;
      const expiresIn = resp.data.expires_in;
      const refreshToken = resp.data.refresh_token;
      const scope = resp.data.scope;

      console.log("accessToken", accessToken);
      console.log("tokenType", tokenType);


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
      return UserModel.update({ email }, updateData ,
        (err, user) => {
          if (err) {
            console.error(err);
            return res.json({
              status: 'FAILED',
              errors: [ { message: 'Invalid user.'} ]
            });
          }
          return res.json({
            status: 'OK'
          })
        });

    }).catch(err => console.error(err));

  });

});

module.exports = router;