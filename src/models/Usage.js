const mongoose = require('mongoose');
const { AI_FEATURES } = require('../utils/constants');

const usageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    feature: {
      type: String,
      enum: Object.values(AI_FEATURES),
      required: true,
    },
    model: {
      type: String,
      default: '',
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    requestCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

// Frequently queried when computing "requests used this month"
usageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Usage', usageSchema);
