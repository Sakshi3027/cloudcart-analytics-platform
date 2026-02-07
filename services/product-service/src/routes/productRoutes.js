const express = require('express');
const productController = require('../controllers/productController');
const validate = require('../middleware/validator');

const router = express.Router();

router.post('/', validate('createProduct'), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', validate('updateProduct'), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.get('/categories/all', productController.getCategories);

module.exports = router;
