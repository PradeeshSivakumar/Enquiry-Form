const express = require('express');
const rolesController = require('../controllers/roles.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticateToken, rolesController.getRoles);
router.get('/active', authenticateToken, rolesController.getActiveRoles);
router.post('/', authenticateToken, rolesController.createRole);
router.put('/:id', authenticateToken, rolesController.updateRole);
router.delete('/:id', authenticateToken, rolesController.deleteRole);
router.patch('/:id/toggle-status', authenticateToken, rolesController.toggleRoleStatus);

router.get('/:id/permissions', authenticateToken, rolesController.getRolePermissions);
router.post('/:id/permissions', authenticateToken, rolesController.saveRolePermissions);

module.exports = router;
