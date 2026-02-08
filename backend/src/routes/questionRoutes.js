const express = require('express');
const { body } = require('express-validator');
const questionController = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const { seniorOnly, requireRole } = require('../middleware/rbac');
const { isQuestionOwner } = require('../middleware/ownership');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

// Senior: create
router.post(
  '/',
  seniorOnly,
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('submissionDeadline').isISO8601(),
    body('tags').optional().isArray(),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  ],
  validate,
  questionController.create
);

// Senior: my questions
router.get('/mine', seniorOnly, questionController.listMine);

// Researcher: open questions (no owner exposed in anonymous mode)
router.get('/open', requireRole('researcher'), questionController.listOpen);

// Researcher: questions I've answered
router.get('/answered', requireRole('researcher'), questionController.listAnswered);

// Get one (by id) - param id
router.get('/:id', questionController.getOne);

// Senior: update (draft only)
router.put(
  '/:questionId',
  seniorOnly,
  isQuestionOwner,
  [
    body('title').optional().trim().notEmpty(),
    body('description').optional().trim().notEmpty(),
    body('submissionDeadline').optional().isISO8601(),
    body('tags').optional().isArray(),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']),
  ],
  validate,
  questionController.update
);

router.post('/:questionId/publish', seniorOnly, isQuestionOwner, questionController.publish);
router.post('/:questionId/close', seniorOnly, isQuestionOwner, questionController.closeQuestion);

// Senior: delete question
router.delete('/:questionId', seniorOnly, isQuestionOwner, questionController.deleteQuestion);

module.exports = router;
