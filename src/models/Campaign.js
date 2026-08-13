const mongoose = require('mongoose');
const { CAMPAIGN_STATUSES } = require('../utils/constants');

const campaignSchema = new mongoose.Schema(
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
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
      maxlength: 150,
    },
    platform: {
      type: String,
      required: [true, 'Platform is required'],
      trim: true,
    },
    objective: {
      type: String,
      trim: true,
      default: '',
    },
    budget: {
      type: Number,
      default: 0,
      min: 0,
    },
    status: {
      type: String,
      enum: CAMPAIGN_STATUSES,
      default: 'draft',
    },
    generatedCopy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Campaign', campaignSchema);
