const express = require('express');
const router = express.Router();
const validator = require('validator');

const UserModel = require('../schemas/users');

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
    const newUser = new UserModel({email, password});
    newUser.save((err) => {
      if (err) console.error(err);
      return res.json({
        status: 'OK',
        data: newUser
      });
    });
  });

});

module.exports = router;