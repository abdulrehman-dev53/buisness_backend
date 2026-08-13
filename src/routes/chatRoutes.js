const express = require('express');
const { body, param } = require('express-validator');
const { sendMessage, getChatHistory, deleteConversation } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');
const { aiLimiter } = require('../middleware/rateLimitMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  aiLimiter,
  [
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('conversationId').optional().isMongoId(),
  ],
  validate,
  sendMessage
);

router.get('/history', getChatHistory);
router.delete('/:id', [param('id').isMongoId()], validate, deleteConversation);

module.exports = router;
