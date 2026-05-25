const express = require('express');
const sidebarController = require('../controllers/sidebar.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticateToken, sidebarController.getSidebar);

module.exports = router;
