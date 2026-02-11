const express = require('express');
const analyticsController = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');
const { pradhikaranOfficeOnly } = require('../middleware/rbac');

const router = express.Router();

router.get('/dashboard', protect, pradhikaranOfficeOnly, analyticsController.dashboard);

module.exports = router;
