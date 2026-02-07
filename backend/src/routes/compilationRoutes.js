const express = require('express');
const { body } = require('express-validator');
const compilationController = require('../controllers/compilationController');
const { protect } = require('../middleware/auth');
const { seniorOnly } = require('../middleware/rbac');
const { isQuestionOwner } = require('../middleware/ownership');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect, seniorOnly);

router.put(
  '/questions/:questionId/compilation',
  isQuestionOwner,
  [body('content').optional().isString()],
  validate,
  compilationController.saveCompilation
);

router.post('/questions/:questionId/compilation/approve', isQuestionOwner, compilationController.approveCompilation);

module.exports = router;
