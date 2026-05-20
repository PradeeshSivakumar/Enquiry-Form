const express = require('express');
const productsController = require('../controllers/products.controller');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const { PRODUCT_MASTER_ROLES } = require('../utils/constants');

const router = express.Router();
const authorizeProductMaster = authorizeRoles(PRODUCT_MASTER_ROLES);

router.get('/active', productsController.getActiveProducts);
router.get('/', authenticateToken, authorizeProductMaster, productsController.getProducts);
router.post('/', authenticateToken, authorizeProductMaster, productsController.createProduct);
router.put('/:id', authenticateToken, authorizeProductMaster, productsController.updateProduct);
router.delete('/:id', authenticateToken, authorizeProductMaster, productsController.deleteProduct);

module.exports = router;
