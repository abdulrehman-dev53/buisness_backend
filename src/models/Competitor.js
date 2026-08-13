const mongoose = require('mongoose');

const competitorSchema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Business',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Competitor name is required'],
      trim: true,
      maxlength: 150,
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
    },
    lastAnalysis: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIAnalysis',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Competitor', competitorSchema);
