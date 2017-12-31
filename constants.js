module.exports = {
  status200: 'OK',
  status400: 'FAILED',
  passwordMin: 6,
  passwordMax: 20,
  bcryptSaltRounds: 10,
  levels: {
    ONTRACK_DEFAULT: 10,
    DANGER_DEFAULT: 1
  },
  errors: {
    INVALID_EMAIL: 'Email is not valid.',
    INVALID_PASSWORD: 'Password must be between 6 and 20 char in length.',
    PASSWORDS_DONT_MATCH: 'Passwords do not match.',
    ACCOUNT_EXISTS: 'Account already exists.',
    INVALID_LOGIN: 'Email and/or Password invalid.',
    INVALID_USER: 'Invalid user.',
    INTERNAL_SERVER_ERROR: 'System is currently down. Try again later.',
    EXCHANGE_NOT_SET: 'Exchange must be set',
    USER_ID_NOT_SET: 'User id was not set'
  },
  webURL: 'http://crypto-manager-web.s3-website-us-west-1.amazonaws.com',
  exchanges: {
    coinbase: {
      oauthURL: 'https://www.coinbase.com/oauth/authorize',
      scope: 'wallet:accounts:read,wallet:transactions:read'
    }
  }
}