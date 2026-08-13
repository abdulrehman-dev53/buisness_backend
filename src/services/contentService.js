const groqService = require('./groqService');
const aiPromptService = require('./aiPromptService');
const GeneratedContent = require('../models/GeneratedContent');

/**
 * Generates marketing ad copy (with variations) for a given platform
 * and persists it as a GeneratedContent record.
 */
const generateMarketingCopy = async ({ userId, businessId, input }) => {
  const { product, targetAudience, platform, tone, objective, variationCount } = input;

  const { systemPrompt, userPrompt } = aiPromptService.buildMarketingPrompt({
    product,
    targetAudience,
    platform,
    tone,
    objective,
    variationCount: variationCount || 3,
  });

  const { data, tokensUsed, model } = await groqService.getJSONCompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.8,
  });

  const record = await GeneratedContent.create({
    userId,
    businessId,
    source: 'marketing',
    contentType: 'Marketing Ad',
    platform,
    prompt: input,
    output: data,
  });

  return { record, tokensUsed, model };
};

/**
 * Generates a single piece of content (caption, blog outline, email, etc.)
 * and persists it as a GeneratedContent record.
 */
const generateContent = async ({ userId, businessId, business, input }) => {
  const { contentType, topic, tone, keywords, platform } = input;

  const { systemPrompt, userPrompt } = aiPromptService.buildContentPrompt({
    contentType,
    topic,
    business,
    tone,
    keywords,
  });

  const { data, tokensUsed, model } = await groqService.getJSONCompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.75,
  });

  const record = await GeneratedContent.create({
    userId,
    businessId,
    source: 'content',
    contentType,
    platform: platform || '',
    prompt: input,
    output: data,
  });

  return { record, tokensUsed, model };
};

/**
 * Generates a full 30-day content calendar and persists it as a
 * GeneratedContent record (source: 'content-calendar').
 */
const generateContentCalendar = async ({ userId, businessId, input }) => {
  const { business, industry, targetAudience, platform, goals } = input;

  const { systemPrompt, userPrompt } = aiPromptService.buildContentCalendarPrompt({
    business,
    industry,
    targetAudience,
    platform,
    goals,
  });

  const { data, tokensUsed, model } = await groqService.getJSONCompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 4096,
  });

  const record = await GeneratedContent.create({
    userId,
    businessId,
    source: 'content-calendar',
    contentType: 'Content Calendar',
    platform: platform || '',
    prompt: input,
    output: data,
  });

  return { record, tokensUsed, model };
};

/**
 * Generates ad copy for a specific campaign and returns the raw AI
 * output (persistence into the Campaign document happens in the
 * controller, since it updates an existing Campaign rather than
 * creating a new GeneratedContent record).
 */
const generateCampaignCopy = async ({ campaignName, platform, objective, budget, business }) => {
  const { systemPrompt, userPrompt } = aiPromptService.buildCampaignCopyPrompt({
    campaignName,
    platform,
    objective,
    budget,
    business,
  });

  return groqService.getJSONCompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.75,
  });
};

module.exports = {
  generateMarketingCopy,
  generateContent,
  generateContentCalendar,
  generateCampaignCopy,
};
