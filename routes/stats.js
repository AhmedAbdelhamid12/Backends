const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { auth, authorize } = require('../middleware/auth');

// Public endpoint - overview statistics
router.get('/overview', statsController.getOverview);

// Admin only endpoints
router.get('/monthly', auth, authorize('admin'), statsController.getMonthlyStats);
router.get('/user-growth', auth, authorize('admin'), statsController.getUserGrowth);
router.get('/course-performance', auth, authorize('admin'), statsController.getCoursePerformance);

module.exports = router;
