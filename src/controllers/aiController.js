const asyncHandler = require('express-async-handler');
const Business = require('../models/Business');
const Product = require('../models/Product');
const Competitor = require('../models/Competitor');
const Campaign = require('../models/Campaign');
const businessAnalysisService = require('../services/businessAnalysisService');
const competitorService = require('../services/competitorService');
const contentService = require('../services/contentService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { checkUsageLimit, logUsage } = require('../utils/usageTracker');
const { AI_FEATURES } = require('../utils/constants');

/**
 * Shared guard: verifies the user hasn't hit their monthly AI request
 * limit before an expensive Groq call is made. Returns the usage info
 * so callers can attach it to responses (e.g. dashboard, remaining count).
 */
const enforceUsageLimit = async (res, userId, plan) => {
  const usage = await checkUsageLimit(userId, plan);
  if (!usage.allowed) {
    sendError(
      res,
      429,
      `You have reached your monthly AI request limit (${usage.limit}) for the ${plan} plan. Upgrade your plan or wait until next month.`,
      { usage }
    );
    return null;
  }
  return usage;
};

// @desc    Generate a full AI business analysis for the caller's business
// @route   POST /api/ai/business-analysis
// @access  Private
const businessAnalysis = asyncHandler(async (req, res) => {
  const usage = await enforceUsageLimit(res, req.user._id, req.user.plan);
  if (!usage) return;

  const business = await Business.findOne({ userId: req.user._id });
  if (!business) {
    return sendError(res, 404, 'Please create a business profile before running an analysis');
  }

  const products = await Product.find({ businessId: business._id });

  const { analysis, tokensUsed, model } = await businessAnalysisService.runBusinessAnalysis({
    userId: req.user._id,
    business,
    products,
  });

  await logUsage({
    userId: req.user._id,
    feature: AI_FEATURES.BUSINESS_ANALYSIS,
    model,
    tokensUsed,
  });

  return sendSuccess(res, 201, 'Business analysis generated successfully', { analysis });
});

// @desc    Generate marketing ad copy with variations
// @route   POST /api/ai/generate-marketing
// @access  Private
const generateMarketing = asyncHandler(async (req, res) => {
  const usage = await enforceUsageLimit(res, req.user._id, req.user.plan);
  if (!usage) return;

  const business = await Business.findOne({ userId: req.user._id });
  if (!business) {
    return sendError(res, 404, 'Please create a business profile first');
  }

  const { record, tokensUsed, model } = await contentService.generateMarketingCopy({
    userId: req.user._id,
    businessId: business._id,
    input: req.body,
  });

  await logUsage({
    userId: req.user._id,
    feature: AI_FEATURES.MARKETING_GENERATION,
    model,
    tokensUsed,
  });

  return sendSuccess(res, 201, 'Marketing content generated successfully', { content: record });
});

// @desc    Generate a single piece of content (caption, blog outline, etc.)
// @route   POST /api/ai/generate-content
// @access  Private
const generateContent = asyncHandler(async (req, res) => {
  const usage = await enforceUsageLimit(res, req.user._id, req.user.plan);
  if (!usage) return;

  const business = await Business.findOne({ userId: req.user._id });
  if (!business) {
    return sendError(res, 404, 'Please create a business profile first');
  }

  const { record, tokensUsed, model } = await contentService.generateContent({
    userId: req.user._id,
    businessId: business._id,
    business,
    input: req.body,
  });

  await logUsage({
    userId: req.user._id,
    feature: AI_FEATURES.CONTENT_GENERATION,
    model,
    tokensUsed,
  });

  return sendSuccess(res, 201, 'Content generated successfully', { content: record });
});

// @desc    Generate a 30-day content calendar
// @route   POST /api/ai/content-calendar
// @access  Private
const contentCalendar = asyncHandler(async (req, res) => {
  const usage = await enforceUsageLimit(res, req.user._id, req.user.plan);
  if (!usage) return;

  const business = await Business.findOne({ userId: req.user._id });
  if (!business) {
    return sendError(res, 404, 'Please create a business profile first');
  }

  const { record, tokensUsed, model } = await contentService.generateContentCalendar({
    userId: req.user._id,
    businessId: business._id,
    input: {
      business: req.body.business || business.businessName,
      industry: req.body.industry || business.industry,
      targetAudience: req.body.targetAudience || business.targetAudience,
      platform: req.body.platform,
      goals: req.body.goals || (business.businessGoals || []).join(', '),
    },
  });

  await logUsage({
    userId: req.user._id,
    feature: AI_FEATURES.CONTENT_CALENDAR,
    model,
    tokensUsed,
  });

  return sendSuccess(res, 201, '30-day content calendar generated successfully', { content: record });
});

// @desc    Run an AI competitor analysis
// @route   POST /api/ai/competitor-analysis/:id
// @access  Private
const competitorAnalysis = asyncHandler(async (req, res) => {
  const usage = await enforceUsageLimit(res, req.user._id, req.user.plan);
  if (!usage) return;

  const business = await Business.findOne({ userId: req.user._id });
  if (!business) {
    return sendError(res, 404, 'Please create a business profile first');
  }

  const competitor = await Competitor.findOne({ _id: req.params.id, userId: req.user._id });
  if (!competitor) {
    return sendError(res, 404, 'Competitor not found');
  }

  const { analysis, tokensUsed, model } = await competitorService.runCompetitorAnalysis({
    userId: req.user._id,
    business,
    competitor,
  });

  await logUsage({
    userId: req.user._id,
    feature: AI_FEATURES.COMPETITOR_ANALYSIS,
    model,
    tokensUsed,
  });

  return sendSuccess(res, 201, 'Competitor analysis generated successfully', { analysis });
});

// @desc    Generate ad copy for a specific campaign and attach it
// @route   POST /api/ai/campaign-copy
// @access  Private
const campaignCopy = asyncHandler(async (req, res) => {
  const usage = await enforceUsageLimit(res, req.user._id, req.user.plan);
  if (!usage) return;

  const { campaignId, platform, objective, budget, campaignName } = req.body;

  const business = await Business.findOne({ userId: req.user._id });
  if (!business) {
    return sendError(res, 404, 'Please create a business profile first');
  }

  let campaign = null;
  if (campaignId) {
    campaign = await Campaign.findOne({ _id: campaignId, userId: req.user._id });
    if (!campaign) {
      return sendError(res, 404, 'Campaign not found');
    }
  }

  const { data, tokensUsed, model } = await contentService.generateCampaignCopy({
    campaignName: campaignName || campaign?.name,
    platform: platform || campaign?.platform,
    objective: objective || campaign?.objective,
    budget: budget ?? campaign?.budget,
    business,
  });

  if (campaign) {
    campaign.generatedCopy = data;
    await campaign.save();
  }

  await logUsage({
    userId: req.user._id,
    feature: AI_FEATURES.CAMPAIGN_COPY,
    model,
    tokensUsed,
  });

  return sendSuccess(res, 201, 'Campaign copy generated successfully', { campaignCopy: data, campaign });
});

module.exports = {
  businessAnalysis,
  generateMarketing,
  generateContent,
  contentCalendar,
  competitorAnalysis,
  campaignCopy,
};
