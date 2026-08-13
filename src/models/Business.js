const mongoose = require('mongoose');

const businessSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      maxlength: 150,
    },
    industry: {
      type: String,
      required: [true, 'Industry is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    targetAudience: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    businessGoals: {
      type: [String],
      default: [],
    },
    brandTone: {
      type: String,
      trim: true,
      default: '',
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    services: {
      type: [String],
      default: [],
    },
    competitors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Competitor',
      },
    ],
  },
  { timestamps: true }
);

// One business profile per user (extend to array later if multi-business
// support is needed; kept 1:1 for simplicity per the current spec)
businessSchema.index({ userId: 1 });

module.exports = mongoose.model('Business', businessSchema);
