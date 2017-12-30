const jwt = require('jsonwebtoken');

const getJWT = (req) => {
  const authHeader = req.get('Authorization');

  if (!authHeader && !authHeader.match(/^Bearer /)) {
    return null;
  }

  const jwt = authHeader.replace("Bearer", "").trim();
  return jwt;
}

const isValidJWT = (jwtData) => {
  if (!jwtData) return false;

  return jwt.verify(jwtData, "REPLATETHISSOON", (err, decoded) => {
    if (err) return false;
    return decoded;
  });
};

module.exports = {
  getJWT,
  isValidJWT
}