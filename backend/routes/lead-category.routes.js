const express = require('express');
const leadCategoryController = require('../controllers/lead-category.controller');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const { PRODUCT_MASTER_ROLES } = require('../utils/constants');

const router = express.Router();
// Role-based authorization removed for lead categories: endpoints are publicly accessible.
router.get('/active', leadCategoryController.getActiveLeadCategories);
router.get('/', leadCategoryController.getLeadCategories);
router.post('/', leadCategoryController.createLeadCategory);
router.put('/:id', leadCategoryController.updateLeadCategory);
router.delete('/:id', leadCategoryController.deleteLeadCategory);

module.exports = router;

