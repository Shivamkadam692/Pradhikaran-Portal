const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { pradhikaranOfficeOnly } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

// Pradhikaran Office routes (protected by pradhikaranOfficeOnly middleware)
router.get('/pending', pradhikaranOfficeOnly, userController.getPendingRegistrations);
router.post(
  '/:userId/approve',
  pradhikaranOfficeOnly,
  [
    body('reason').optional().isString().withMessage('Reason must be a string').isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
  ],
  validate,
  userController.approveRegistration
);
router.post(
  '/:userId/reject',
  pradhikaranOfficeOnly,
  [
    body('reason').optional().isString().withMessage('Reason must be a string').isLength({ max: 500 }).withMessage('Reason must be less than 500 characters')
  ],
  validate,
  userController.rejectRegistration
);
router.get('/departments', pradhikaranOfficeOnly, userController.getAllDepartments);
router.post('/:userId/toggle-status', pradhikaranOfficeOnly, userController.toggleUserStatus);

// General user routes
router.get('/:userId', userController.getUserById);
router.put(
  '/:userId',
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
    body('department').optional().trim().notEmpty().withMessage('Department cannot be empty').isLength({ max: 100 }).withMessage('Department must be less than 100 characters'),
    body('institution').optional({ nullable: true }).trim().isLength({ max: 150 }).withMessage('Institution must be less than 150 characters'),
    body('isActive').optional().isBoolean().withMessage('isActive must be true or false'),
    body('registrationStatus').optional().isIn(['pending', 'approved', 'rejected']).withMessage('Invalid registration status'),
  ],
  validate,
  userController.updateUser
);

module.exports = router;