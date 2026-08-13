const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const Business = require('../models/Business');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// Helper: fetches the caller's business or throws a standard 404 response
const getOwnedBusiness = async (userId) => Business.findOne({ userId });

// @desc    Create a product/service under the caller's business
// @route   POST /api/products
// @access  Private
const createProduct = asyncHandler(async (req, res) => {
  const business = await getOwnedBusiness(req.user._id);
  if (!business) {
    return sendError(res, 404, 'Please create a business profile before adding products');
  }

  const product = await Product.create({
    ...req.body,
    businessId: business._id,
    userId: req.user._id,
  });

  business.products.push(product._id);
  await business.save();

  return sendSuccess(res, 201, 'Product created successfully', { product });
});

// @desc    Get all products for the caller's business
// @route   GET /api/products
// @access  Private
const getProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return sendSuccess(res, 200, 'Products fetched successfully', { products, count: products.length });
});

// @desc    Get a single product by id
// @route   GET /api/products/:id
// @access  Private
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, userId: req.user._id });
  if (!product) {
    return sendError(res, 404, 'Product not found');
  }
  return sendSuccess(res, 200, 'Product fetched successfully', { product });
});

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    req.body,
    { new: true, runValidators: true }
  );

  if (!product) {
    return sendError(res, 404, 'Product not found');
  }

  return sendSuccess(res, 200, 'Product updated successfully', { product });
});

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!product) {
    return sendError(res, 404, 'Product not found');
  }

  await Business.updateOne({ userId: req.user._id }, { $pull: { products: product._id } });

  return sendSuccess(res, 200, 'Product deleted successfully', {});
});

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };
