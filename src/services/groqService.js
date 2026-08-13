const { groqClient, GROQ_MODEL } = require('../config/groq');

/**
 * groqService is the ONLY module in the codebase that talks to the Groq
 * SDK directly. Controllers and other services must never import
 * config/groq.js themselves - everything goes through here so the AI
 * provider can be swapped out later without touching business logic.
 */

/**
 * Sends a prompt to Groq and expects back a JSON object matching the
 * shape described in the prompt. Automatically strips markdown code
 * fences if the model wraps its JSON in them, and throws a descriptive
 * error if the response cannot be parsed.
 *
 * @param {Object} params
 * @param {string} params.systemPrompt - Instructions/context for the model.
 * @param {string} params.userPrompt - The specific request/content.
 * @param {number} [params.temperature=0.7]
 * @param {number} [params.maxTokens=2048]
 * @returns {Promise<{ data: Object, tokensUsed: number, model: string }>}
 */
const getJSONCompletion = async ({
  systemPrompt,
  userPrompt,
  temperature = 0.7,
  maxTokens = 2048,
}) => {
  const completion = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
  });

  const rawContent = completion.choices?.[0]?.message?.content || '';
  const tokensUsed = completion.usage?.total_tokens || 0;

  let data;
  try {
    const cleaned = rawContent
      .trim()
      .replace(/^```json/i, '')
      .replace(/^```/, '')
      .replace(/```$/, '')
      .trim();
    data = JSON.parse(cleaned);
  } catch (err) {
    const parseError = new Error('AI returned an invalid response format. Please try again.');
    parseError.statusCode = 502;
    throw parseError;
  }

  return { data, tokensUsed, model: GROQ_MODEL };
};

/**
 * Sends a plain conversational prompt to Groq (used by the chat
 * assistant) and returns free-form text rather than JSON.
 *
 * @param {Object} params
 * @param {string} params.systemPrompt
 * @param {Array<{role: 'user'|'assistant', content: string}>} params.history
 * @param {number} [params.temperature=0.7]
 * @param {number} [params.maxTokens=1024]
 */
const getTextCompletion = async ({
  systemPrompt,
  history = [],
  temperature = 0.7,
  maxTokens = 1024,
}) => {
  const completion = await groqClient.chat.completions.create({
    model: GROQ_MODEL,
    temperature,
    max_tokens: maxTokens,
    messages: [{ role: 'system', content: systemPrompt }, ...history],
  });

  const reply = completion.choices?.[0]?.message?.content || '';
  const tokensUsed = completion.usage?.total_tokens || 0;

  return { reply, tokensUsed, model: GROQ_MODEL };
};

module.exports = { getJSONCompletion, getTextCompletion };
