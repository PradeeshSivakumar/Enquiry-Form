const express = require('express');
const departmentController = require('../controllers/department.controller');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const { PRODUCT_MASTER_ROLES } = require('../utils/constants');

const router = express.Router();
// Role-based authorization removed for departments: endpoints are publicly accessible.
router.get('/active', departmentController.getActiveDepartments);
router.get('/', departmentController.getDepartments);
router.post('/', departmentController.createDepartment);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);


module.exports = router;
