const express = require('express');
const { body, param } = require('express-validator');
const {
  businessAnalysis,
  generateMarketing,
  generateContent,
  contentCalendar,
  competitorAnalysis,
  campaignCopy,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimitMiddleware');
const validate = require('../middleware/validationMiddleware');
const { CONTENT_TYPES, MARKETING_PLATFORMS } = require('../utils/constants');

const router = express.Router();

router.use(protect, aiLimiter);

router.post('/business-analysis', businessAnalysis);

router.post(
  '/generate-marketing',
  [
    body('product').trim().notEmpty().withMessage('Product is required'),
    body('targetAudience').trim().notEmpty().withMessage('Target audience is required'),
    body('platform')
      .trim()
      .isIn(MARKETING_PLATFORMS)
      .withMessage(`Platform must be one of: ${MARKETING_PLATFORMS.join(', ')}`),
  ],
  validate,
  generateMarketing
);

router.post(
  '/generate-content',
  [
    body('contentType')
      .trim()
      .isIn(CONTENT_TYPES)
      .withMessage(`Content type must be one of: ${CONTENT_TYPES.join(', ')}`),
    body('topic').trim().notEmpty().withMessage('Topic/brief is required'),
  ],
  validate,
  generateContent
);

router.post(
  '/content-calendar',
  [
    body('platform').trim().notEmpty().withMessage('Platform is required'),
    body('goals').optional().trim(),
  ],
  validate,
  contentCalendar
);

router.post(
  '/competitor-analysis/:id',
  [param('id').isMongoId().withMessage('Invalid competitor id')],
  validate,
  competitorAnalysis
);

router.post(
  '/campaign-copy',
  [
    body('campaignId').optional().isMongoId(),
    body('platform').optional().trim(),
    body('objective').optional().trim(),
  ],
  validate,
  campaignCopy
);

module.exports = router;
