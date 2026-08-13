const express = require('express');
const { body } = require('express-validator');
const {
  createBusiness,
  getBusiness,
  updateBusiness,
  deleteBusiness,
} = require('../controllers/businessController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

const createValidation = [
  body('businessName').trim().notEmpty().withMessage('Business name is required'),
  body('industry').trim().notEmpty().withMessage('Industry is required'),
  body('website').optional({ checkFalsy: true }).isURL().withMessage('Website must be a valid URL'),
  body('businessGoals').optional().isArray(),
  body('services').optional().isArray(),
];

// Same fields but all optional, since PUT may only send a subset to update
const updateValidation = [
  body('businessName').optional().trim().notEmpty().withMessage('Business name cannot be empty'),
  body('industry').optional().trim().notEmpty().withMessage('Industry cannot be empty'),
  body('website').optional({ checkFalsy: true }).isURL().withMessage('Website must be a valid URL'),
  body('businessGoals').optional().isArray(),
  body('services').optional().isArray(),
];

router.post('/', createValidation, validate, createBusiness);
router.get('/', getBusiness);
router.put('/', updateValidation, validate, updateBusiness);
router.delete('/', deleteBusiness);

module.exports = router;
