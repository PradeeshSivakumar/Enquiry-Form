const express = require('express');
const rolesController = require('../controllers/roles.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticateToken, rolesController.getModules);

module.exports = router;
