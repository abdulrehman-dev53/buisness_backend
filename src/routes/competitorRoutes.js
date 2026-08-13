const express = require('express');
const { body, param } = require('express-validator');
const {
  createCompetitor,
  getCompetitors,
  deleteCompetitor,
} = require('../controllers/competitorController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validationMiddleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Competitor name is required'),
    body('website').optional({ checkFalsy: true }).isURL().withMessage('Website must be a valid URL'),
  ],
  validate,
  createCompetitor
);

router.get('/', getCompetitors);
router.delete('/:id', [param('id').isMongoId()], validate, deleteCompetitor);

module.exports = router;
