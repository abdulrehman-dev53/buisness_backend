const express = require('express');
const { body, param } = require('express-validator');
const {
  getContentHistory,
  getContentById,
  updateContent,
  deleteContent,
  regenerateContent,
} = require('../controllers/contentController');
const { protect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimitMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getContentHistory);
router.get('/:id', [param('id').isMongoId()], validate, getContentById);
router.put(
  '/:id',
  [param('id').isMongoId(), body('isSaved').isBoolean()],
  validate,
  updateContent
);
router.delete('/:id', [param('id').isMongoId()], validate, deleteContent);
router.post(
  '/:id/regenerate',
  aiLimiter,
  [param('id').isMongoId()],
  validate,
  regenerateContent
);

module.exports = router;
