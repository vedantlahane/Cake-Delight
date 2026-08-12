const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/checkout', orderController.checkout);
router.post('/checkout/:userId', orderController.checkout);
router.get('/', orderController.getAllOrders);
router.get('/:userId', orderController.getOrder);

module.exports = router;