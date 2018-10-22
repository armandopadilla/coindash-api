const axios = require('axios');
const qs = require('qs');
const constants = require('../constants');

/**
 * Fetch the access token once the user has passed the first step
 * of fetching the code from coinbase.
 *
 * @param code
 * @returns {Promise}
 */
const getAccessToken = (code) => {
  return new Promise((resolve, reject) => {
    if (!code) return reject(constants.errors.INVALID_COINBASE_CODE);

    // Get the access token
    const params = constants.exchanges.coinbase.oauthTokenURL+'?'+qs.stringify({
        grant_type: 'authorization_code',
        code,
        client_id: process.env.COINBASE_CLIENT_ID,
        client_secret: process.env.COINBASE_CLIENT_SECRET,
        redirect_uri: constants.webURL+'/link-account',
        score: constants.exchanges.coinbase.scope,
        account: 'all'
      });

    return axios.post(params)
      .then(resp => {
        if (!resp.data.access_token) return reject(constants.errors.COINBASE_GENERAL_ERROR);

        const {
          access_token: accessToken,
          token_type: tokenType,
          expires_in: expiresIn,
          refresh_token: refreshToken,
          scope
        } = resp.data;

        return resolve({
          accessToken,
          tokenType,
          expiresIn,
          refreshToken,
          scope
        })
      })
      .catch(error => {
        console.log(error);
        reject(error.message)
      });
  });
};

module.exports = {
  getAccessToken
};