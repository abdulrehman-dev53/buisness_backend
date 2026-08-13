const mongoose = require('mongoose');
const { CONTENT_TYPES } = require('../utils/constants');

const generatedContentSchema = new mongoose.Schema(
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
    // Distinguishes marketing-generator output from content-generator output
    source: {
      type: String,
      enum: ['marketing', 'content', 'campaign-copy', 'content-calendar'],
      required: true,
    },
    contentType: {
      type: String,
      enum: [...CONTENT_TYPES, 'Marketing Ad', 'Campaign Copy', 'Content Calendar'],
      required: true,
    },
    platform: {
      type: String,
      trim: true,
      default: '',
    },
    prompt: {
      type: mongoose.Schema.Types.Mixed, // the input parameters used to generate this
      default: {},
    },
    output: {
      type: mongoose.Schema.Types.Mixed, // structured AI output (may include variations[])
      required: true,
    },
    isSaved: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

generatedContentSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('GeneratedContent', generatedContentSchema);
