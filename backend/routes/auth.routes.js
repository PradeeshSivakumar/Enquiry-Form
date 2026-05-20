const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/login', authController.login);
router.put('/change-password', authenticateToken, authController.changePassword);

module.exports = router;
