const express = require('express');
const router = express.Router();

const { decryptData } = require('../utils/crypto');
const { resError400, resSuccess200 } = require('../utils/responseHandler');
const UserModel = require('../schemas/users');
const { isValidJWT } = require('../utils/utils');
const constants = require('../constants');
const Coinbase = require('../services/coinbase');


/**
 * Link the account by using the code provided by coinbase.
 *
 */
router.post('/coinbase', (req, res) => {
  const code = req.body.code || '';
  const state = req.body.state || '';

  // Validate
  if (!code) return resError400(res, constants.errors.INVALID_COINBASE_CODE);
  if (!state) return resError400(res, constants.errors.INVALID_STATE);

  // Decrypt the state (contains the id of the user)
  let jwt;
  if (!(jwt = isValidJWT(state))) return resError400(res, constants.errors.INVALID_JWT);
  const sessionData = decryptData(jwt.data);
  const sessionJSON = JSON.parse(sessionData);
  const userId = sessionJSON.id;

  return Coinbase.getAccessToken(code)
    .then(resp => {
      const updateData = {
        coinbase: {
          accessToken: resp.accessToken,
          expiresIn: resp.expiresIn,
          refreshToken: resp.refreshToken,
          scope: resp.scope,
          tokenType: resp.tokenType,
          updatedDate: new Date()
        }
      };

      // Grab the accessToken and refreshToken and save to mongo
      return UserModel.update({ _id: userId }, updateData, (error, user) => {
        if (error) return resError400(res, error.message);
        if (!user) return resError400(res, constants.errors.INVALID_USER);
        return resSuccess200(res);
      });
    })
    .catch(error => resError400(res, error));
});

module.exports = router;