const asyncHandler = require('express-async-handler');
const GeneratedContent = require('../models/GeneratedContent');
const Business = require('../models/Business');
const contentService = require('../services/contentService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { logUsage, checkUsageLimit } = require('../utils/usageTracker');
const { AI_FEATURES } = require('../utils/constants');

// @desc    Get the caller's content generation history
// @route   GET /api/content
// @access  Private
const getContentHistory = asyncHandler(async (req, res) => {
  const { source, contentType, page = 1, limit = 20 } = req.query;

  const filter = { userId: req.user._id };
  if (source) filter.source = source;
  if (contentType) filter.contentType = contentType;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    GeneratedContent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    GeneratedContent.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Content history fetched successfully', {
    items,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  });
});

// @desc    Get a single saved content item
// @route   GET /api/content/:id
// @access  Private
const getContentById = asyncHandler(async (req, res) => {
  const item = await GeneratedContent.findOne({ _id: req.params.id, userId: req.user._id });
  if (!item) {
    return sendError(res, 404, 'Content not found');
  }
  return sendSuccess(res, 200, 'Content fetched successfully', { item });
});

// @desc    Toggle/set the saved status of a content item (unsave without deleting)
// @route   PUT /api/content/:id
// @access  Private
const updateContent = asyncHandler(async (req, res) => {
  const item = await GeneratedContent.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { isSaved: req.body.isSaved },
    { new: true }
  );
  if (!item) {
    return sendError(res, 404, 'Content not found');
  }
  return sendSuccess(res, 200, 'Content updated successfully', { item });
});

// @desc    Delete a saved content item
// @route   DELETE /api/content/:id
// @access  Private
const deleteContent = asyncHandler(async (req, res) => {
  const item = await GeneratedContent.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!item) {
    return sendError(res, 404, 'Content not found');
  }
  return sendSuccess(res, 200, 'Content deleted successfully', {});
});

// @desc    Regenerate content using the original stored prompt parameters
// @route   POST /api/content/:id/regenerate
// @access  Private
const regenerateContent = asyncHandler(async (req, res) => {
  const original = await GeneratedContent.findOne({ _id: req.params.id, userId: req.user._id });
  if (!original) {
    return sendError(res, 404, 'Content not found');
  }

  const usage = await checkUsageLimit(req.user._id, req.user.plan);
  if (!usage.allowed) {
    return sendError(
      res,
      429,
      `You have reached your monthly AI request limit (${usage.limit}) for the ${req.user.plan} plan.`
    );
  }

  const business = await Business.findOne({ userId: req.user._id });

  let result;
  if (original.source === 'marketing') {
    result = await contentService.generateMarketingCopy({
      userId: req.user._id,
      businessId: original.businessId,
      input: original.prompt,
    });
  } else if (original.source === 'content-calendar') {
    result = await contentService.generateContentCalendar({
      userId: req.user._id,
      businessId: original.businessId,
      input: original.prompt,
    });
  } else {
    result = await contentService.generateContent({
      userId: req.user._id,
      businessId: original.businessId,
      business,
      input: original.prompt,
    });
  }

  await logUsage({
    userId: req.user._id,
    feature: AI_FEATURES.CONTENT_GENERATION,
    model: result.model,
    tokensUsed: result.tokensUsed,
  });

  return sendSuccess(res, 201, 'Content regenerated successfully', { content: result.record });
});

module.exports = {
  getContentHistory,
  getContentById,
  updateContent,
  deleteContent,
  regenerateContent,
};
