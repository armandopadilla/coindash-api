// Get the user's settings
// Investment
//  Yellow - X%
//  Red - below Y%
//  Green - over Z%
// Alerts
//  Alert me for health of portfolio
//  Alert me for health of individual investment
//  Alert me when X reaches Y.
// Native Settings
//  Select the currency of the user

const express = require('express');
const router = express.Router();
const UserModel = require('../schemas/users');
const {
  resSuccess200,
  resError400
} = require('../utils/responseHandler');
const constants = require('../constants');
const utils = require('../utils/utils');
const {
  decryptData
} = require('../utils/crypto');

/**
 * Fetch the user's settings
 * Settings:
 *  Levels - What the user feels a "on track" (green), "panic" (red) is
 *         - Note that warning is between the top values.
 */
router.get('/', (req, res) => {

  const init = {
    investments: {
      danger: constants.levels.DANGER_DEFAULT,
      onTrack: constants.levels.ONTRACK_DEFAULT
    }
  };

  const userId = utils.getJWTData(res, req).id;

  return UserModel.findOne({ _id: userId }, (error, data) => {
    if (!data) return resSuccess200(res, init);

    const danger = data.levels.danger;
    const onTrack = data.levels.onTrack;

    return resSuccess200(res, { investments: { danger, onTrack } });
  });
});


/**
 * Update the settings for a user.
 */
router.put('/', (req, res) => {
  const userId = utils.getJWTData(res, req).id;
  const onTrack = req.body.onTrack;
  const danger = req.body.danger;

  return UserModel.update({ _id: userId }, {$set: {
    'levels.onTrack': onTrack,
    'levels.danger': danger
  } }, (error, data) => {
    if (error) return resError400(res, error.message);
    return resSuccess200(res);
  });

});

module.exports = router;
