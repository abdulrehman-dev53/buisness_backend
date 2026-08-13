const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['business-analysis', 'competitor-analysis'],
      required: true,
    },
    // Present only when type === 'competitor-analysis'
    competitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Competitor',
      default: null,
    },
    // Raw structured AI output stored as-is for flexibility
    result: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    businessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    model: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

aiAnalysisSchema.index({ userId: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
