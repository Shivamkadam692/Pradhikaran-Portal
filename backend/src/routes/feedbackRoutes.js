const express = require('express');
const { body } = require('express-validator');
const feedbackController = require('../controllers/feedbackController');
const { protect } = require('../middleware/auth');
const { canAccessAnswer } = require('../middleware/ownership');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.post(
  '/answers/:answerId/comments',
  canAccessAnswer,
  [
    body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 2000 }).withMessage('Comment must be less than 2000 characters'),
    body('startIndex').isInt({ min: 0 }).withMessage('Start index must be a non-negative integer'),
    body('endIndex').isInt({ min: 0 }).withMessage('End index must be a non-negative integer'),
    body('answerVersionId').optional().isMongoId().withMessage('Invalid answer version ID format'),
  ],
  validate,
  feedbackController.add
);

router.get('/answers/:answerId/comments', canAccessAnswer, feedbackController.list);

router.patch('/answers/:answerId/comments/:commentId/resolve', canAccessAnswer, feedbackController.resolve);

module.exports = router;
