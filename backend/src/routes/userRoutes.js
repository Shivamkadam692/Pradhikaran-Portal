const express = require('express');
const userController = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { pradhikaranOfficeOnly } = require('../middleware/rbac');

const router = express.Router();

router.use(protect);

// Pradhikaran Office routes (protected by pradhikaranOfficeOnly middleware)
router.get('/pending', pradhikaranOfficeOnly, userController.getPendingRegistrations);
router.post('/:userId/approve', pradhikaranOfficeOnly, userController.approveRegistration);
router.post('/:userId/reject', pradhikaranOfficeOnly, userController.rejectRegistration);
router.get('/departments', pradhikaranOfficeOnly, userController.getAllDepartments);
router.post('/:userId/toggle-status', pradhikaranOfficeOnly, userController.toggleUserStatus);

// General user routes
router.get('/:userId', userController.getUserById);
router.put('/:userId', userController.updateUser);

module.exports = router;