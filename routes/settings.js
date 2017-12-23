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

/**
 * Fetch the user's settings
 * Settings:
 *  Levels - What the user feels a "on track" (green), "panic" (red) is
 *         - Note that warning is between the top values.
 *  TODO - Default Native Currency - Default is USD but the user can set it.
 *  TODO - Alerts
 */
router.get('/', (req, res) => {
  const init = {
    investments: {
      danger: 30,
      onTrack: 60
    }
  };

  // TODO - Change this when we have more users.
  return UserModel.findOne({firstName: 'Armando'}, (err, data) => {
    if (!data) return res.json(init);

    const danger = data.levels.danger;
    const onTrack = data.levels.onTrack;

    return res.json({
      investments: { danger, onTrack }
    });

  });
})


/**
 * Update the settings for a user.
 * TODO - Update specific user.
 */
router.put('/', (req, res) => {
  const onTrack = req.body.onTrack;
  const danger = req.body.danger;

  return UserModel.update({firstName: 'Armando'}, {$set: {
    'levels.onTrack': onTrack,
    'levels.danger': danger
  } }, (err, data) => {
    if (err) return res.json({ status: 'FAILED' });
    return res.json({
      status: 'SUCCESS'
    })
  });

})

module.exports = router;
