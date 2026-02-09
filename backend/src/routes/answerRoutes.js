const express = require('express');
const { body } = require('express-validator');
const answerController = require('../controllers/answerController');
const compilationController = require('../controllers/compilationController');
const { protect } = require('../middleware/auth');
const { seniorOnly, requireRole } = require('../middleware/rbac');
const { isQuestionOwner, canAccessAnswer } = require('../middleware/ownership');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

// Researcher: submit/revise answer for a question (with file upload support)
router.post(
  '/questions/:questionId/answers',
  requireRole('researcher'),
  upload.array('attachments', 5), // Allow up to 5 files
  [
    body('content').optional().isString(),
    body('revisionNote').optional().isString(),
  ],
  validate,
  answerController.submit
);

// File download endpoint
router.get('/answers/:answerId/files/:fileId', canAccessAnswer, answerController.downloadFile);

// List answers for a question (senior: all; researcher: own only)
router.get('/questions/:questionId/answers', answerController.listByQuestion);

// Get one answer - need to load answer for canAccessAnswer; use answerId in URL
router.get('/answers/:answerId', canAccessAnswer, answerController.getOne);

// Version history
router.get('/answers/:answerId/versions', canAccessAnswer, answerController.getVersions);

// Senior: delete answer
router.delete('/answers/:answerId', seniorOnly, canAccessAnswer, answerController.deleteAnswer);

// Senior: request revision
router.post(
  '/answers/:answerId/request-revision',
  seniorOnly,
  canAccessAnswer,
  [body('revisionReason').optional().isString()],
  validate,
  answerController.requestRevision
);

// Senior: approve / reject answer
router.post('/answers/:answerId/approve', seniorOnly, canAccessAnswer, compilationController.approveAnswer);
router.post(
  '/answers/:answerId/reject',
  seniorOnly,
  canAccessAnswer,
  [body('reason').optional().isString()],
  validate,
  compilationController.rejectAnswer
);

module.exports = router;
