const express = require('express');
const { body } = require('express-validator');
const questionController = require('../controllers/questionController');
const { protect } = require('../middleware/auth');
const { pradhikaranOfficeOnly, requireRole } = require('../middleware/rbac');
const { isQuestionOwner } = require('../middleware/ownership');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

// Pradhikaran Office: create
router.post(
  '/',
  pradhikaranOfficeOnly,
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

// Pradhikaran Office: all questions (for management dashboard)
router.get('/all', pradhikaranOfficeOnly, questionController.listAll);

// Pradhikaran Office: my questions
router.get('/mine', pradhikaranOfficeOnly, questionController.listMine);

// Departments: open questions (no owner exposed in anonymous mode)
router.get('/open', requireRole('departments'), questionController.listOpen);

// Departments: questions I've answered
router.get('/answered', requireRole('departments'), questionController.listAnswered);

// Get one (by id) - param id
router.get('/:id', questionController.getOne);

// Pradhikaran Office: update (draft only)
router.put(
  '/:questionId',
  pradhikaranOfficeOnly,
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

router.post('/:questionId/publish', pradhikaranOfficeOnly, isQuestionOwner, questionController.publish);
router.post('/:questionId/close', pradhikaranOfficeOnly, isQuestionOwner, questionController.closeQuestion);

// Pradhikaran Office: delete question
router.delete('/:questionId', pradhikaranOfficeOnly, isQuestionOwner, questionController.deleteQuestion);

module.exports = router;
