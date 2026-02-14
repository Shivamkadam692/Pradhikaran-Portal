const express = require('express');
const { body } = require('express-validator');
const answerController = require('../controllers/answerController');
const compilationController = require('../controllers/compilationController');
const { protect } = require('../middleware/auth');
const { pradhikaranOfficeOnly, requireRole } = require('../middleware/rbac');
const { isQuestionOwner, canAccessAnswer } = require('../middleware/ownership');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

// Departments: submit/revise answer for a question (with file upload support)
router.post(
  '/questions/:questionId/answers',
  requireRole('departments'),
  upload.array('attachments', 5), // Allow up to 5 files
  [
    body('content').optional().isString().withMessage('Content must be a string').isLength({ max: 10000 }).withMessage('Content must be less than 10,000 characters'),
    body('revisionNote').optional().isString().withMessage('Revision note must be a string').isLength({ max: 500 }).withMessage('Revision note must be less than 500 characters'),
  ],
  validate,
  answerController.submit
);

// File download endpoint
router.get('/answers/:answerId/files/:fileId', canAccessAnswer, answerController.downloadFile);

// Pradhikaran Office: all answers (for management dashboard)
router.get('/answers/all', pradhikaranOfficeOnly, answerController.listAll);

// List answers for a question (senior: all; researcher: own only)
router.get('/questions/:questionId/answers', answerController.listByQuestion);

// Get one answer - need to load answer for canAccessAnswer; use answerId in URL
router.get('/answers/:answerId', canAccessAnswer, answerController.getOne);

// Version history
router.get('/answers/:answerId/versions', canAccessAnswer, answerController.getVersions);

// Pradhikaran Office: delete answer
router.delete('/answers/:answerId', pradhikaranOfficeOnly, canAccessAnswer, answerController.deleteAnswer);

// Pradhikaran Office: request revision
router.post(
  '/answers/:answerId/request-revision',
  pradhikaranOfficeOnly,
  canAccessAnswer,
  [
    body('revisionReason').optional().isString().withMessage('Revision reason must be a string').isLength({ max: 1000 }).withMessage('Revision reason must be less than 1000 characters')
  ],
  validate,
  answerController.requestRevision
);

// Pradhikaran Office: approve / reject answer
router.post('/answers/:answerId/approve', pradhikaranOfficeOnly, canAccessAnswer, compilationController.approveAnswer);
router.post(
  '/answers/:answerId/reject',
  pradhikaranOfficeOnly,
  canAccessAnswer,
  [
    body('reason').optional().isString().withMessage('Rejection reason must be a string').isLength({ max: 1000 }).withMessage('Rejection reason must be less than 1000 characters')
  ],
  validate,
  compilationController.rejectAnswer
);

module.exports = router;
