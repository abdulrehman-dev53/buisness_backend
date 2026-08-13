const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { sendError } = require('../utils/apiResponse');

/**
 * Verifies the JWT sent in the Authorization header (Bearer token),
 * loads the corresponding user (without password), and attaches it
 * to req.user. Rejects the request if the token or user is invalid.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return sendError(res, 401, 'Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendError(res, 401, 'Not authorized, user no longer exists');
    }

    if (!user.isActive) {
      return sendError(res, 403, 'This account has been deactivated');
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, 401, 'Not authorized, token invalid or expired');
  }
});

/**
 * Restricts access to users whose role is included in `roles`.
 * Usage: router.delete('/:id', protect, authorize('admin'), handler)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, 'You do not have permission to perform this action');
    }
    next();
  };
};

module.exports = { protect, authorize };
