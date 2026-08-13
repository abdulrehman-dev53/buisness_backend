const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
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
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    price: {
      type: Number,
      default: 0,
      min: 0,
    },
    features: {
      type: [String],
      default: [],
    },
    targetAudience: {
      type: String,
      trim: true,
      default: '',
    },
    uniqueSellingPoints: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
