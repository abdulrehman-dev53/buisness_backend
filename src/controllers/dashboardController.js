const asyncHandler = require('express-async-handler');
const Business = require('../models/Business');
const Product = require('../models/Product');
const Competitor = require('../models/Competitor');
const GeneratedContent = require('../models/GeneratedContent');
const Campaign = require('../models/Campaign');
const AIAnalysis = require('../models/AIAnalysis');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { checkUsageLimit, getMonthlyRequestCount } = require('../utils/usageTracker');

// @desc    Get a full dashboard snapshot in a single request
// @route   GET /api/dashboard
// @access  Private
const getDashboard = asyncHandler(async (req, res) => {
  const business = await Business.findOne({ userId: req.user._id });

  if (!business) {
    // Still return a usable payload for a brand-new account instead of a
    // hard error, so the frontend can render an onboarding empty state.
    const usage = await checkUsageLimit(req.user._id, req.user.plan);
    return sendSuccess(res, 200, 'Dashboard fetched successfully', {
      businessScore: null,
      totalProducts: 0,
      totalCompetitors: 0,
      totalGeneratedContent: 0,
      totalAIRequests: usage.used,
      remainingAIRequests: usage.remaining,
      recentAnalyses: [],
      recentContent: [],
      recentCampaigns: [],
      growthRecommendations: [],
      onboardingComplete: false,
    });
  }

  const [
    totalProducts,
    totalCompetitors,
    totalGeneratedContent,
    usage,
    latestAnalysis,
    recentAnalyses,
    recentContent,
    recentCampaigns,
  ] = await Promise.all([
    Product.countDocuments({ businessId: business._id }),
    Competitor.countDocuments({ businessId: business._id }),
    GeneratedContent.countDocuments({ businessId: business._id }),
    checkUsageLimit(req.user._id, req.user.plan),
    AIAnalysis.findOne({ businessId: business._id, type: 'business-analysis' }).sort({
      createdAt: -1,
    }),
    AIAnalysis.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(5),
    GeneratedContent.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(5),
    Campaign.find({ businessId: business._id }).sort({ createdAt: -1 }).limit(5),
  ]);

  return sendSuccess(res, 200, 'Dashboard fetched successfully', {
    businessScore: latestAnalysis?.businessScore ?? null,
    totalProducts,
    totalCompetitors,
    totalGeneratedContent,
    totalAIRequests: usage.used,
    remainingAIRequests: usage.remaining,
    recentAnalyses,
    recentContent,
    recentCampaigns,
    growthRecommendations: latestAnalysis?.result?.growthOpportunities || [],
    onboardingComplete: true,
  });
});

module.exports = { getDashboard };
