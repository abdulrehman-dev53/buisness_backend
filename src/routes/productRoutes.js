const express = require('express');
const { body, param } = require('express-validator');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('features').optional().isArray(),
    body('uniqueSellingPoints').optional().isArray(),
  ],
  validate,
  createProduct
);

router.get('/', getProducts);

router.get('/:id', [param('id').isMongoId()], validate, getProductById);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('price').optional().isFloat({ min: 0 }),
    body('features').optional().isArray(),
    body('uniqueSellingPoints').optional().isArray(),
  ],
  validate,
  updateProduct
);

router.delete('/:id', [param('id').isMongoId()], validate, deleteProduct);

module.exports = router;
