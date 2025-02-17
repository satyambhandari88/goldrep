// dashboardRoutes.js
const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// All routes are protected with auth middleware
router.use(auth);

// Get shop overview stats
router.get('/stats', dashboardController.getShopStats);

// Get sales analysis
router.get('/sales', dashboardController.getSalesAnalysis);

// Get inventory analysis
router.get('/inventory', dashboardController.getInventoryAnalysis);

// Get Udhaar analysis
router.get('/udhaar', dashboardController.getUdhaarAnalysis);

// Get metal prices trends
router.get('/metal-prices', dashboardController.getMetalPrices);

module.exports = router;