const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { seniorOnly } = require('../middleware/rbac');

const router = express.Router();

router.get('/dashboard', protect, seniorOnly, analyticsController.dashboard);

module.exports = router;
