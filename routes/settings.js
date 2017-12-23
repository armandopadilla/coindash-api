const express = require('express');
const router = express.Router();

// Fetch
router.get('/', (req, res) => {


  res.json({
    investments: {
      warningLevel: 12,
      dangerLevel: 50,
      successLevel: 60
    }
  })
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
})

// Add
router.put('/')

module.exports = router;
