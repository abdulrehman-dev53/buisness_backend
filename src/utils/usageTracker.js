const Usage = require('../models/Usage');
const { PLAN_LIMITS } = require('./constants');

/**
 * Returns the start of the current calendar month (UTC) used as the
 * boundary for "monthly" AI usage limits.
 */
const getStartOfMonth = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
};

/**
 * Counts how many AI requests a user has made since the start of the
 * current month (sum of requestCount across Usage documents).
 */
const getMonthlyRequestCount = async (userId) => {
  const result = await Usage.aggregate([
    {
      $match: {
        userId: typeof userId === 'string' ? new (require('mongoose').Types.ObjectId)(userId) : userId,
        createdAt: { $gte: getStartOfMonth() },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$requestCount' },
      },
    },
  ]);

  return result.length > 0 ? result[0].total : 0;
};

/**
 * Checks whether a user (given their plan) still has AI requests remaining
 * for the current month. Returns { allowed, used, limit, remaining }.
 */
const checkUsageLimit = async (userId, plan) => {
  const limit = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
  const used = await getMonthlyRequestCount(userId);
  const remaining = Math.max(limit - used, 0);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
  };
};

/**
 * Logs a single AI usage event. Call this after a successful Groq request.
 */
const logUsage = async ({ userId, feature, model = '', tokensUsed = 0 }) => {
  return Usage.create({
    userId,
    feature,
    model,
    tokensUsed,
    requestCount: 1,
  });
};

module.exports = {
  getStartOfMonth,
  getMonthlyRequestCount,
  checkUsageLimit,
  logUsage,
};
