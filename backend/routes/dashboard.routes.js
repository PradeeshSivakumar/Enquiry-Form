const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/stats', authenticateToken, dashboardController.getStats);
router.get('/recent-enquiries', authenticateToken, dashboardController.getRecentEnquiries);
router.get('/monthly-trends', authenticateToken, dashboardController.getMonthlyTrends);
router.get('/product-distribution', authenticateToken, dashboardController.getProductDistribution);
router.get('/venue-analytics', authenticateToken, dashboardController.getVenueAnalytics);

module.exports = router;
