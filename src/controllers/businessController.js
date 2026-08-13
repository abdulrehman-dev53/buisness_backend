const asyncHandler = require('express-async-handler');
const Business = require('../models/Business');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Create the current user's business profile
// @route   POST /api/business
// @access  Private
const createBusiness = asyncHandler(async (req, res) => {
  const existing = await Business.findOne({ userId: req.user._id });
  if (existing) {
    return sendError(res, 409, 'A business profile already exists for this account. Use PUT to update it.');
  }

  const business = await Business.create({ ...req.body, userId: req.user._id });

  return sendSuccess(res, 201, 'Business profile created successfully', { business });
});

// @desc    Get the current user's business profile
// @route   GET /api/business
// @access  Private
const getBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findOne({ userId: req.user._id })
    .populate('products')
    .populate('competitors');

  if (!business) {
    return sendError(res, 404, 'No business profile found. Please create one first.');
  }

  return sendSuccess(res, 200, 'Business profile fetched successfully', { business });
});

// @desc    Update the current user's business profile
// @route   PUT /api/business
// @access  Private
const updateBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findOneAndUpdate({ userId: req.user._id }, req.body, {
    new: true,
    runValidators: true,
  });

  if (!business) {
    return sendError(res, 404, 'No business profile found. Please create one first.');
  }

  return sendSuccess(res, 200, 'Business profile updated successfully', { business });
});

// @desc    Delete the current user's business profile
// @route   DELETE /api/business
// @access  Private
const deleteBusiness = asyncHandler(async (req, res) => {
  const business = await Business.findOneAndDelete({ userId: req.user._id });

  if (!business) {
    return sendError(res, 404, 'No business profile found.');
  }

  return sendSuccess(res, 200, 'Business profile deleted successfully', {});
});

module.exports = { createBusiness, getBusiness, updateBusiness, deleteBusiness };
