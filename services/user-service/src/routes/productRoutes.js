const express = require('express');
const productController = require('../controllers/productController');
const validate = require('../middleware/validator');

const router = express.Router();

// Product routes
router.post('/', validate('createProduct'), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', validate('updateProduct'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

// Category routes
router.get('/categories/all', productController.getCategories);

module.exports = router;