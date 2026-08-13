const rateLimit = require('express-rate-limit');

/**
 * General-purpose API rate limiter applied to all routes.
 * Protects against brute-force and abusive traffic patterns.
 */
const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

/**
 * Stricter limiter for authentication endpoints to slow down
 * credential-stuffing / brute-force login attempts.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.',
  },
});

/**
 * Stricter, shorter-window limiter specifically for AI endpoints, which
 * are the most expensive routes (Groq API calls). This is a hard
 * request-per-minute throttle, separate from the monthly plan-based
 * usage limit enforced in the AI controllers.
 */
const aiLimiter = rateLimit({
  windowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60 * 1000, // 1 min
  max: Number(process.env.AI_RATE_LIMIT_MAX) || 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests in a short period. Please slow down and try again shortly.',
  },
});

module.exports = { apiLimiter, authLimiter, aiLimiter };
