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
    body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
    body('submissionDeadline').isISO8601().withMessage('Valid deadline date is required'),
    body('tags').optional().isArray().withMessage('Tags must be an array').customSanitizer((value) => Array.isArray(value) ? value.slice(0, 10) : []),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
    body('anonymousMode').optional().isBoolean().withMessage('Anonymous mode must be true or false'),
    body('targetDepartment').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Target department must be less than 100 characters'),
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
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('description').optional().trim().notEmpty().withMessage('Description cannot be empty').isLength({ max: 5000 }).withMessage('Description must be less than 5000 characters'),
    body('submissionDeadline').optional().isISO8601().withMessage('Valid deadline date is required'),
    body('tags').optional().isArray().withMessage('Tags must be an array').customSanitizer((value) => Array.isArray(value) ? value.slice(0, 10) : []),
    body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),
    body('anonymousMode').optional().isBoolean().withMessage('Anonymous mode must be true or false'),
    body('targetDepartment').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Target department must be less than 100 characters'),
  ],
  validate,
  questionController.update
);

router.post('/:questionId/publish', pradhikaranOfficeOnly, isQuestionOwner, questionController.publish);
router.post('/:questionId/close', pradhikaranOfficeOnly, isQuestionOwner, questionController.closeQuestion);

// Pradhikaran Office: delete question
router.delete('/:questionId', pradhikaranOfficeOnly, isQuestionOwner, questionController.deleteQuestion);

module.exports = router;
