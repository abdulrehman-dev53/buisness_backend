const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return sendError(res, 409, 'An account with this email already exists');
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id, user.role);

  return sendSuccess(res, 201, 'Account created successfully', {
    user,
    token,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user) {
    return sendError(res, 401, 'Invalid email or password');
  }

  if (!user.isActive) {
    return sendError(res, 403, 'This account has been deactivated');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 401, 'Invalid email or password');
  }

  const token = generateToken(user._id, user.role);
  user.password = undefined;

  return sendSuccess(res, 200, 'Login successful', { user, token });
});

// @desc    Logout user (client discards token; endpoint provided for
//          symmetry / future token-blacklisting support)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'Logged out successfully', {});
});

// @desc    Get currently authenticated user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  return sendSuccess(res, 200, 'User fetched successfully', { user: req.user });
});

// @desc    Update profile (name, avatar)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { name, avatar } = req.body;

  if (name !== undefined) req.user.name = name;
  if (avatar !== undefined) req.user.avatar = avatar;

  await req.user.save();

  return sendSuccess(res, 200, 'Profile updated successfully', { user: req.user });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return sendError(res, 401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  return sendSuccess(res, 200, 'Password changed successfully', {});
});

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
