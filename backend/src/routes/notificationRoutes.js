const express = require('express');
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, notificationController.list);
router.patch('/:id/read', protect, notificationController.markRead);
router.post('/read-all', protect, notificationController.markAllRead);

module.exports = router;
