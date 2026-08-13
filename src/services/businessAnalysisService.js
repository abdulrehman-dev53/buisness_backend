const groqService = require('./groqService');
const aiPromptService = require('./aiPromptService');
const AIAnalysis = require('../models/AIAnalysis');

/**
 * Runs a full AI business analysis for the given business + products,
 * then persists the result in MongoDB. Returns the saved analysis doc.
 */
const runBusinessAnalysis = async ({ userId, business, products }) => {
  const { systemPrompt, userPrompt } = aiPromptService.buildBusinessAnalysisPrompt({
    business,
    products,
  });

  const { data, tokensUsed, model } = await groqService.getJSONCompletion({
    systemPrompt,
    userPrompt,
    temperature: 0.6,
    maxTokens: 3000,
  });

  const analysis = await AIAnalysis.create({
    userId,
    businessId: business._id,
    type: 'business-analysis',
    result: data,
    businessScore: typeof data.businessScore === 'number' ? data.businessScore : null,
    model,
  });

  return { analysis, tokensUsed, model };
};

module.exports = { runBusinessAnalysis };
