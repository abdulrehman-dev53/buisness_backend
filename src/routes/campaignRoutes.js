const express = require('express');
const { body, param } = require('express-validator');
const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} = require('../controllers/campaignController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');
const { CAMPAIGN_STATUSES } = require('../utils/constants');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Campaign name is required'),
    body('platform').trim().notEmpty().withMessage('Platform is required'),
    body('budget').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(CAMPAIGN_STATUSES),
  ],
  validate,
  createCampaign
);

router.get('/', getCampaigns);
router.get('/:id', [param('id').isMongoId()], validate, getCampaignById);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('budget').optional().isFloat({ min: 0 }),
    body('status').optional().isIn(CAMPAIGN_STATUSES),
  ],
  validate,
  updateCampaign
);

router.delete('/:id', [param('id').isMongoId()], validate, deleteCampaign);

module.exports = router;
