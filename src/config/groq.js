const Groq = require('groq-sdk');

if (!process.env.GROQ_API_KEY) {
  console.warn(
    'WARNING: GROQ_API_KEY is not set. AI features will fail until it is configured in .env'
  );
}

/**
 * Single shared Groq client instance.
 * IMPORTANT: This client (and the API key) must never be imported into,
 * or exposed via, any route that serves data directly to the frontend.
 * All AI calls must be proxied through services/groqService.js.
 */
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

module.exports = { groqClient, GROQ_MODEL };
