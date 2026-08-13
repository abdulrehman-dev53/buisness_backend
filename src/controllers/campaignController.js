const asyncHandler = require('express-async-handler');
const Campaign = require('../models/Campaign');
const Business = require('../models/Business');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Create a campaign
// @route   POST /api/campaigns
// @access  Private
const createCampaign = asyncHandler(async (req, res) => {
  const business = await Business.findOne({ userId: req.user._id });
  if (!business) {
    return sendError(res, 404, 'Please create a business profile before creating campaigns');
  }

  const campaign = await Campaign.create({
    ...req.body,
    userId: req.user._id,
    businessId: business._id,
  });

  return sendSuccess(res, 201, 'Campaign created successfully', { campaign });
});

// @desc    Get all campaigns for the caller
// @route   GET /api/campaigns
// @access  Private
const getCampaigns = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { userId: req.user._id };
  if (status) filter.status = status;

  const campaigns = await Campaign.find(filter).sort({ createdAt: -1 });
  return sendSuccess(res, 200, 'Campaigns fetched successfully', {
    campaigns,
    count: campaigns.length,
  });
});

// @desc    Get a single campaign
// @route   GET /api/campaigns/:id
// @access  Private
const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });
  if (!campaign) {
    return sendError(res, 404, 'Campaign not found');
  }
  return sendSuccess(res, 200, 'Campaign fetched successfully', { campaign });
});

// @desc    Update a campaign
// @route   PUT /api/campaigns/:id
// @access  Private
const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );
  if (!campaign) {
    return sendError(res, 404, 'Campaign not found');
  }
  return sendSuccess(res, 200, 'Campaign updated successfully', { campaign });
});

// @desc    Delete a campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
const deleteCampaign = asyncHandler(async (req, res) => {
  const campaign = await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!campaign) {
    return sendError(res, 404, 'Campaign not found');
  }
  return sendSuccess(res, 200, 'Campaign deleted successfully', {});
});

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
};
