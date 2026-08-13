const groqService = require('./groqService');
const aiPromptService = require('./aiPromptService');
const AIAnalysis = require('../models/AIAnalysis');
const Competitor = require('../models/Competitor');

/**
 * Runs an AI competitor analysis based strictly on the competitor data
 * the user has entered (name/website/description). Does NOT scrape or
 * fetch the competitor's website - see the note in the prompt builder.
 * If real website scraping is added later, it should live in its own
 * dedicated service and be passed in as additional context here.
 */
const runCompetitorAnalysis = async ({ userId, business, competitor }) => {
  const { systemPrompt, userPrompt } = aiPromptService.buildCompetitorPrompt({
    competitor,
    business,
  });

  const { data, tokensUsed, model } = await groqService.getJSONCompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.5,
    maxTokens: 2000,
  });

  const analysis = await AIAnalysis.create({
    userId,
    businessId: business._id,
    type: 'competitor-analysis',
    competitorId: competitor._id,
    result: data,
    model,
  });

  await Competitor.findByIdAndUpdate(competitor._id, { lastAnalysis: analysis._id });

  return { analysis, tokensUsed, model };
};

module.exports = { runCompetitorAnalysis };
