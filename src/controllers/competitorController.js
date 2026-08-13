const asyncHandler = require('express-async-handler');
const Competitor = require('../models/Competitor');
const Business = require('../models/Business');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Add a competitor under the caller's business
// @route   POST /api/competitors
// @access  Private
const createCompetitor = asyncHandler(async (req, res) => {
  const business = await Business.findOne({ userId: req.user._id });
  if (!business) {
    return sendError(res, 404, 'Please create a business profile before adding competitors');
  }

  const competitor = await Competitor.create({
    ...req.body,
    businessId: business._id,
    userId: req.user._id,
  });

  business.competitors.push(competitor._id);
  await business.save();

  return sendSuccess(res, 201, 'Competitor added successfully', { competitor });
});

// @desc    Get all competitors for the caller's business
// @route   GET /api/competitors
// @access  Private
const getCompetitors = asyncHandler(async (req, res) => {
  const competitors = await Competitor.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return sendSuccess(res, 200, 'Competitors fetched successfully', {
    competitors,
    count: competitors.length,
  });
});

// @desc    Delete a competitor
// @route   DELETE /api/competitors/:id
// @access  Private
const deleteCompetitor = asyncHandler(async (req, res) => {
  const competitor = await Competitor.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!competitor) {
    return sendError(res, 404, 'Competitor not found');
  }

  await Business.updateOne({ userId: req.user._id }, { $pull: { competitors: competitor._id } });

  return sendSuccess(res, 200, 'Competitor deleted successfully', {});
});

module.exports = { createCompetitor, getCompetitors, deleteCompetitor };
