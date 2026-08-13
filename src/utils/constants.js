// Centralized constants so limits/enums are defined once and reused
// across models, middleware, and services.

const PLANS = {
  FREE: 'free',
  PRO: 'pro',
  BUSINESS: 'business',
};

// Monthly AI request allowance per plan
const PLAN_LIMITS = {
  [PLANS.FREE]: 20,
  [PLANS.PRO]: 200,
  [PLANS.BUSINESS]: 1000,
};

const AI_FEATURES = {
  BUSINESS_ANALYSIS: 'business-analysis',
  MARKETING_GENERATION: 'marketing-generation',
  CONTENT_GENERATION: 'content-generation',
  CONTENT_CALENDAR: 'content-calendar',
  COMPETITOR_ANALYSIS: 'competitor-analysis',
  CAMPAIGN_COPY: 'campaign-copy',
  CHAT: 'chat',
};

const ROLES = {
  USER: 'user',
  ADMIN: 'admin',
};

const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'];

const CONTENT_TYPES = [
  'Instagram Caption',
  'Facebook Post',
  'LinkedIn Post',
  'Blog Outline',
  'SEO Meta Description',
  'Product Description',
  'Email',
  'Ad Copy',
  'CTA',
];

const MARKETING_PLATFORMS = [
  'Instagram',
  'Facebook',
  'Google Ads',
  'LinkedIn',
  'Email',
  'Website',
];

module.exports = {
  PLANS,
  PLAN_LIMITS,
  AI_FEATURES,
  ROLES,
  CAMPAIGN_STATUSES,
  CONTENT_TYPES,
  MARKETING_PLATFORMS,
};
