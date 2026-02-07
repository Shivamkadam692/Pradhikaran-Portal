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
    body('text').trim().notEmpty(),
    body('startIndex').isInt({ min: 0 }),
    body('endIndex').isInt({ min: 0 }),
    body('answerVersionId').optional().isMongoId(),
  ],
  validate,
  feedbackController.add
);

router.get('/answers/:answerId/comments', canAccessAnswer, feedbackController.list);

router.patch('/answers/:answerId/comments/:commentId/resolve', canAccessAnswer, feedbackController.resolve);

module.exports = router;
