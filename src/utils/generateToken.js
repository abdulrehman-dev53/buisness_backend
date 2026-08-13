const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for a given user.
 * Payload intentionally kept minimal (userId, role) to avoid leaking
 * sensitive data inside the token itself.
 */
const generateToken = (userId, role) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = generateToken;
