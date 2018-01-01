const jwt = require('jsonwebtoken');

/**
 * Get the JWT from the header.
 *
 * @param req
 * @returns {*}
 */
const getJWT = (req) => {
  const authHeader = req.get('Authorization');

  if (!authHeader && !authHeader.match(/^Bearer /)) {
    return null;
  }

  const jwt = authHeader.replace("Bearer", "").trim();
  return jwt;
}

/**
 * Check if the JWT is valid.
 *
 * @param jwtData
 * @returns {*}
 */
const isValidJWT = (jwtData) => {
  if (!jwtData) return false;
  return jwt.verify(jwtData, process.env.APP_SECRET, (err, decoded) => {
    if (err) return false;
    return decoded;
  });
};


module.exports = {
  getJWT,
  isValidJWT
};