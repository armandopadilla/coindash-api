const express = require('express');
const router = express.Router();
const validator = require('validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const qs = require('qs');
const axios = require('axios');
const constants = require('../constants');

const {
  resError400,
  resSuccess200,
  resError500
} = require('../utils/responseHandler');

const {
  encryptData
} = require('../utils/crypto');

const ExchangeService = require('../services/exchange');

const UserModel = require('../schemas/users');


/**
 * Sign the user up.
 * Creates a new record in the DB.
 * Hashes the password.
 *
 */
router.post('/signup', (req, res) => {

  const email = req.body.email || '';
  const password = req.body.password || '';
  const repassword = req.body.repassword || '';

  // Validate
  const errors = [];
  if (!validator.isEmail(email)) errors.push({ message: constants.errors.INVALID_EMAIL });
  if (password.length < constants.passwordMin || password.length > constants.passwordMax) errors.push({ message: constants.errors.INVALID_PASSWORD });
  if (password != repassword) errors.push({ message: constants.errors.PASSWORDS_DONT_MATCH });

  if (errors.length) return resError400(res, errors);

  // Check if the user already exists
  return UserModel.findOne({ email })
    .then(user => {
      if (user) return resError400(res, constants.errors.ACCOUNT_EXISTS);

      // Save - Set default levels.
      const salt = bcrypt.genSaltSync(constants.bcryptSaltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);
      const newUser = new UserModel({
        email,
        password: hashedPassword,
        levels: {
          onTrack: constants.levels.ONTRACK_DEFAULT,
          danger: constants.levels.DANGER_DEFAULT
        }
      });

      return newUser.save((err) => {
        if (err) return resError400(res, err.message);
        return resSuccess200(res, newUser);
      });
    })
    .catch(error => resError500(res, error));
});


/**
 * Log the user in. Determines if the user should associate the
 * account to coinbase or update the token.
 *
 */
router.post('/login', (req, res) => {
  const email = req.body.email || '';
  const password = req.body.password || '';

  if (!email.trim().length && password.trim().length) return resError400(res, constants.errors.INVALID_LOGIN);

  return UserModel.findOne({ email }, (error, user) => {
    if (error) return resError500(res, error);
    if (!user) return resError400(res, constants.errors.INVALID_LOGIN);

    if(!bcrypt.compareSync(password, user.password)) return resError400(res, constants.errors.INVALID_LOGIN);

    // All good - Create token and determine if user needs to lingk account with coinbase.
    const data = encryptData({ email, id: user.id });
    const token = jwt.sign({ exp: Math.floor(Date.now() / 1000) + (60 * 60), data }, process.env.APP_SECRET);

    // Check if the user should be sent to coinbase
    let toCoinbase = false;
    // New user. Send to coinbase
    if (!user.coinbase) {
      return resSuccess200(res, {
        token,
        toCoinbase: true,
        redirectURL: ExchangeService.getExchageLinkAccountURL('coinbase', token)
      });
    }
    // If it is set then refresh the token.
    else if(user.coinbase) {
      return ExchangeService.refreshAccessToken('coinbase', user.id, user.coinbase.refreshToken)
        .then(() => resSuccess200(res, { toCoinbase, token }))
        .catch(error => resError400(res, constants.errors.INVALID_USER));
    }
    else {
      return resError400(res, constants.errors.INVALID_USER);
    }
  })
});

module.exports = router;