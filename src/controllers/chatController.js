const asyncHandler = require('express-async-handler');
const Conversation = require('../models/Conversation');
const Business = require('../models/Business');
const Product = require('../models/Product');
const AIAnalysis = require('../models/AIAnalysis');
const groqService = require('../services/groqService');
const aiPromptService = require('../services/aiPromptService');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { checkUsageLimit, logUsage } = require('../utils/usageTracker');
const { AI_FEATURES } = require('../utils/constants');

// Groq chat completions endpoint expects alternating user/assistant turns;
// cap history length sent per request to keep prompts efficient.
const MAX_HISTORY_MESSAGES = 20;

// @desc    Send a message to the AI business assistant
// @route   POST /api/chat
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;

  const usage = await checkUsageLimit(req.user._id, req.user.plan);
  if (!usage.allowed) {
    return sendError(
      res,
      429,
      `You have reached your monthly AI request limit (${usage.limit}) for the ${req.user.plan} plan.`
    );
  }

  const [business, conversation] = await Promise.all([
    Business.findOne({ userId: req.user._id }),
    conversationId
      ? Conversation.findOne({ _id: conversationId, userId: req.user._id })
      : Promise.resolve(null),
  ]);

  const activeConversation =
    conversation ||
    new Conversation({
      userId: req.user._id,
      businessId: business?._id || null,
      title: message.slice(0, 60),
      messages: [],
    });

  const [products, recentAnalysis] = await Promise.all([
    business ? Product.find({ businessId: business._id }) : Promise.resolve([]),
    business
      ? AIAnalysis.findOne({ businessId: business._id, type: 'business-analysis' }).sort({
          createdAt: -1,
        })
      : Promise.resolve(null),
  ]);

  const systemPrompt = aiPromptService.buildChatPrompt({ business, products, recentAnalysis });

  const history = activeConversation.messages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  history.push({ role: 'user', content: message });

  const { reply, tokensUsed, model } = await groqService.getTextCompletion({
    systemPrompt,
    history,
  });

  activeConversation.messages.push({ role: 'user', content: message });
  activeConversation.messages.push({ role: 'assistant', content: reply });
  await activeConversation.save();

  await logUsage({
    userId: req.user._id,
    feature: AI_FEATURES.CHAT,
    model,
    tokensUsed,
  });

  return sendSuccess(res, 200, 'Message sent successfully', {
    reply,
    conversationId: activeConversation._id,
  });
});

// @desc    Get the caller's conversation history
// @route   GET /api/chat/history
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
  const { conversationId } = req.query;

  if (conversationId) {
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: req.user._id,
    });
    if (!conversation) {
      return sendError(res, 404, 'Conversation not found');
    }
    return sendSuccess(res, 200, 'Conversation fetched successfully', { conversation });
  }

  const conversations = await Conversation.find({ userId: req.user._id })
    .sort({ updatedAt: -1 })
    .select('title businessId createdAt updatedAt messages');

  return sendSuccess(res, 200, 'Conversations fetched successfully', {
    conversations,
    count: conversations.length,
  });
});

// @desc    Delete a conversation
// @route   DELETE /api/chat/:id
// @access  Private
const deleteConversation = asyncHandler(async (req, res) => {
  const conversation = await Conversation.findOneAndDelete({
    _id: req.params.id,
    userId: req.user._id,
  });
  if (!conversation) {
    return sendError(res, 404, 'Conversation not found');
  }
  return sendSuccess(res, 200, 'Conversation deleted successfully', {});
});

module.exports = { sendMessage, getChatHistory, deleteConversation };
