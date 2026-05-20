const express = require('express');
const employeeController = require('../controllers/employee.controller');
const authenticateToken = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', authenticateToken, employeeController.getEmployees);
router.post('/', authenticateToken, employeeController.createEmployee);
router.put('/:id', authenticateToken, employeeController.updateEmployee);
router.delete('/:id', authenticateToken, employeeController.deleteEmployee);

module.exports = router;
