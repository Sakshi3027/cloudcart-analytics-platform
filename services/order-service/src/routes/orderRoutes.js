const express = require('express');
const orderController = require('../controllers/orderController');
const validate = require('../middleware/validator');

const router = express.Router();

router.post('/', validate('createOrder'), orderController.createOrder);
router.get('/', orderController.getAllOrders);
router.get('/:id', orderController.getOrderById);
router.get('/user/:userId', orderController.getOrdersByUserId);
router.put('/:id/status', validate('updateOrderStatus'), orderController.updateOrderStatus);
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;
