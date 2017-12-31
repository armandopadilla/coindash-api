const constants = require('../constants');

/**
 * Refresh the access token for a specific user.
 * Note: For now leaving bulk of logic here since its only 1 exchange.
 * @param exchange
 * @param userId
 * @returns {Promise}
 */
const refreshAccessToken = (exchange, userId, refreshToken) => {
  return new Promise((resolve, reject) => {
    if (!exchange) return reject(constants.errors.EXCHANGE_NOT_SET);
    if (!userId) return reject(constants.errors.USER_ID_NOT_SET);

    // Refresh the token
    const params = constants.exchanges.coinbase.oauthURL+'?'+qs.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.COINBASE_CLIENT_ID,
        client_secret: process.env.COINBASE_CLIENT_SECRET,
        scope: constants.exchanges.coinbase.scope,
        account: 'all'
      });

    return axios.post(params)
      .then(resp => {
        const {
          access_token: accessToken,
          token_type: tokenType,
          expires_in: expiresIn,
          refresh_token: refreshToken,
          scope
        } = res.data;

        const updateData = {
          coinbase: {
            accessToken,
            expiresIn,
            refreshToken,
            scope,
            tokenType,
            updatedDate: new Date()
          }
        };

        // save it to the db.
        return UserModel.update({ _id: userId }, updateData, (err, user) => {
          if (err) return reject(constants.errors.INVALID_USER);
          return resolve();
        });
      });

  });
};

/**
 * Fetch the init URL to associate a user to coinbase.
 * @param token
 * @returns {string}
 */
const getExchageLinkAccountURL = (exchange, token) => {
  //https://www.coinbase.com/oauth/authorize?client_id=d4acaf682461752e000cf1819b2fc1ae70e0dee216c7f925a514464763e22d73&redirect_uri=http%3A%2F%2Fcrypto-manager-web.s3-website-us-west-1.amazonaws.com%2Flink-account&response_type=code&scope=wallet%3Auser%3Aread'
  const coinbaseURL = constants.exchanges.coinbase.oauthURL;
  const clientId = process.env.COINBASE_CLIENT_ID;
  const state = token;
  const redirectURL = constants.webURL+"/link-account";

  return coinbaseURL+
    "?client_id="+ clientId+
    "&redirect_uri="+redirectURL+
    "&state="+state+
    "&response_type=code"+
    "&scope="+constants.exchanges.coinbase.scope+
    "&account=all";
};

module.exports = {
  getExchageLinkAccountURL,
  refreshAccessToken
};