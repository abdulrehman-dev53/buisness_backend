/**
 * Centralized prompt builders. Keeping all prompt text here (rather than
 * inline in controllers) makes prompts easy to review, version, and tune
 * without touching request-handling logic.
 */

const BASE_JSON_INSTRUCTION =
  'You must respond with ONLY a valid JSON object - no markdown, no prose, no code fences, and no explanation outside the JSON.';

const buildBusinessAnalysisPrompt = ({ business, products = [] }) => {
  const systemPrompt = `You are a senior business intelligence and growth strategy consultant. Analyze the business provided and return a thorough, realistic, actionable assessment. ${BASE_JSON_INSTRUCTION}
Return JSON in exactly this shape:
{
  "businessScore": <number 0-100>,
  "businessSummary": "<string>",
  "targetAudience": "<string>",
  "customerPersonas": [{"name": "<string>", "description": "<string>"}],
  "strengths": ["<string>"],
  "weaknesses": ["<string>"],
  "opportunities": ["<string>"],
  "threats": ["<string>"],
  "growthOpportunities": ["<string>"],
  "marketingRecommendations": ["<string>"],
  "competitorStrategy": "<string>",
  "actionPlan": ["<string>"]
}`;

  const userPrompt = `Business Name: ${business.businessName}
Industry: ${business.industry}
Description: ${business.description || 'N/A'}
Website: ${business.website || 'N/A'}
Target Audience: ${business.targetAudience || 'Not specified'}
Location: ${business.location || 'Not specified'}
Business Goals: ${(business.businessGoals || []).join(', ') || 'Not specified'}
Brand Tone: ${business.brandTone || 'Not specified'}
Services: ${(business.services || []).join(', ') || 'Not specified'}
Products: ${
    products.length
      ? products.map((p) => `${p.name} (${p.category || 'uncategorized'}) - ${p.description || ''}`).join('; ')
      : 'None listed'
  }

Provide a complete, realistic business analysis based only on the information above.`;

  return { systemPrompt, userPrompt };
};

const buildMarketingPrompt = ({ product, targetAudience, platform, tone, objective, variationCount = 3 }) => {
  const systemPrompt = `You are an expert performance marketing copywriter specializing in ${platform} ads. ${BASE_JSON_INSTRUCTION}
Return JSON in exactly this shape:
{
  "headline": "<string>",
  "primaryText": "<string>",
  "description": "<string>",
  "callToAction": "<string>",
  "hashtags": ["<string>"],
  "variations": [
    {"headline": "<string>", "primaryText": "<string>", "description": "<string>", "callToAction": "<string>"}
  ]
}
Generate exactly ${variationCount} items in "variations".`;

  const userPrompt = `Product/Service: ${product}
Target Audience: ${targetAudience}
Platform: ${platform}
Tone: ${tone || 'professional and persuasive'}
Objective: ${objective || 'drive conversions'}

Write high-converting ad copy tailored specifically to ${platform}'s best practices and character conventions.`;

  return { systemPrompt, userPrompt };
};

const buildContentPrompt = ({ contentType, topic, business, tone, keywords }) => {
  const systemPrompt = `You are an expert content marketer and copywriter. ${BASE_JSON_INSTRUCTION}
Return JSON in exactly this shape:
{
  "contentType": "<string>",
  "title": "<string>",
  "content": "<string>",
  "hashtags": ["<string>"],
  "seoKeywords": ["<string>"]
}`;

  const userPrompt = `Content Type: ${contentType}
Topic/Brief: ${topic}
Business: ${business?.businessName || 'N/A'} (${business?.industry || 'N/A'})
Brand Tone: ${tone || business?.brandTone || 'professional'}
Target Keywords: ${keywords || 'N/A'}

Write complete, ready-to-publish content for the specified content type.`;

  return { systemPrompt, userPrompt };
};

const buildContentCalendarPrompt = ({ business, industry, targetAudience, platform, goals }) => {
  const systemPrompt = `You are a senior social media strategist. ${BASE_JSON_INSTRUCTION}
Return JSON in exactly this shape:
{
  "calendar": [
    {
      "day": <number 1-30>,
      "contentType": "<string>",
      "topic": "<string>",
      "hook": "<string>",
      "captionIdea": "<string>",
      "cta": "<string>",
      "platform": "<string>"
    }
  ]
}
The "calendar" array must contain exactly 30 entries, one per day, with varied content types (educational, promotional, behind-the-scenes, testimonial, entertaining, UGC, etc.) that build toward the stated goals.`;

  const userPrompt = `Business: ${business || 'N/A'}
Industry: ${industry}
Target Audience: ${targetAudience}
Primary Platform: ${platform}
Goals: ${goals}

Create a full 30-day content calendar.`;

  return { systemPrompt, userPrompt };
};

const buildCompetitorPrompt = ({ competitor, business }) => {
  const systemPrompt = `You are a competitive intelligence analyst. You must base your analysis ONLY on the information explicitly provided below - do not claim to have browsed, scraped, or fetched the competitor's website. If information is not provided, reason from industry norms and clearly generalized best practices instead of inventing specific facts. ${BASE_JSON_INSTRUCTION}
Return JSON in exactly this shape:
{
  "competitorStrengths": ["<string>"],
  "competitorWeaknesses": ["<string>"],
  "pricingStrategy": "<string>",
  "marketingStrategy": "<string>",
  "targetAudience": "<string>",
  "possibleGaps": ["<string>"],
  "opportunities": ["<string>"],
  "recommendations": ["<string>"]
}`;

  const userPrompt = `Competitor Name: ${competitor.name}
Competitor Website: ${competitor.website || 'Not provided'}
Competitor Description (as entered by the user): ${competitor.description || 'Not provided'}

Our Business: ${business.businessName} (${business.industry})
Our Target Audience: ${business.targetAudience || 'Not specified'}
Our Description: ${business.description || 'Not specified'}

Analyze this competitor relative to our business using only the information above.`;

  return { systemPrompt, userPrompt };
};

const buildCampaignCopyPrompt = ({ campaignName, platform, objective, budget, business }) => {
  const systemPrompt = `You are an expert paid-advertising strategist and copywriter. ${BASE_JSON_INSTRUCTION}
Return JSON in exactly this shape:
{
  "headline": "<string>",
  "primaryText": "<string>",
  "description": "<string>",
  "callToAction": "<string>",
  "hashtags": ["<string>"],
  "budgetRecommendation": "<string>",
  "targetingRecommendation": "<string>"
}`;

  const userPrompt = `Campaign Name: ${campaignName}
Platform: ${platform}
Objective: ${objective}
Budget: ${budget ? `$${budget}` : 'Not specified'}
Business: ${business?.businessName || 'N/A'} (${business?.industry || 'N/A'})
Target Audience: ${business?.targetAudience || 'Not specified'}
Brand Tone: ${business?.brandTone || 'professional'}

Generate compelling campaign copy optimized for ${platform}.`;

  return { systemPrompt, userPrompt };
};

const buildChatPrompt = ({ business, products = [], recentAnalysis }) => {
  return `You are the BizPilot AI Business Assistant - a knowledgeable, friendly business growth advisor embedded inside the user's BI/marketing dashboard.

Always ground your advice in the business context below. Give specific, actionable, personalized recommendations - never generic filler advice. Reference the business by name where natural. Keep responses focused and practical.

BUSINESS CONTEXT:
Name: ${business?.businessName || 'Not set up yet'}
Industry: ${business?.industry || 'N/A'}
Description: ${business?.description || 'N/A'}
Target Audience: ${business?.targetAudience || 'N/A'}
Brand Tone: ${business?.brandTone || 'N/A'}
Business Goals: ${(business?.businessGoals || []).join(', ') || 'N/A'}
Products/Services: ${
    products.length ? products.map((p) => p.name).join(', ') : 'None listed yet'
  }
${
  recentAnalysis
    ? `Most Recent AI Analysis Summary: ${
        recentAnalysis.result?.businessSummary || JSON.stringify(recentAnalysis.result).slice(0, 500)
      }`
    : ''
}

Respond conversationally in plain text (not JSON).`;
};

module.exports = {
  buildBusinessAnalysisPrompt,
  buildMarketingPrompt,
  buildContentPrompt,
  buildContentCalendarPrompt,
  buildCompetitorPrompt,
  buildCampaignCopyPrompt,
  buildChatPrompt,
};
