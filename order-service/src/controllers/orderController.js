const Order = require('../models/Order');
const Basket = require('../models/Basket');
const { publishOrderCompleted } = require('../services/eventPublisher');

/**
 * Retrieves all orders.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function for error handling.
 * @returns {void}
 */
exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves orders for a specific user.
 * @param {Object} req - The request object containing the userId parameter.
 * @param {Object} res - The response object used to send the orders data.
 * @param {Function} next - The next middleware function for error handling.
 * @returns {void}
 */
exports.getOrder = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        res.json(orders);
    }
    catch (err) {
        next(err);
    }
};


/**
 * Processes the checkout for a user's basket.
 * @param {Object} req - The request object containing the userId in the body or headers.
 * @param {Object} res - The response object used to send the order data.
 * @param {Function} next - The next middleware function for error handling.
 * @returns {void}
 */
exports.checkout = async (req, res, next) => {
    try {
        const userId = req.body.userId || req.headers['x-user-id'] || req.params.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const basket = await Basket.findOne({ userId });
        if (!basket || !basket.items || basket.items.length === 0) {
            return res.status(400).json({ error: 'Basket is empty' });
        }

        const total = basket.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        const order = new Order({
            userId,
            items: basket.items,
            total,
            status: 'completed'
        });

        await order.save();

        // Clear user's basket after successful order creation
        basket.items = [];
        await basket.save();

        // Publish event to RabbitMQ
        await publishOrderCompleted({
            orderId: order._id,
            userId: order.userId,
            items: order.items,
            total: order.total,
            createdAt: order.createdAt
        });

        res.status(201).json(order);
    }
    catch (err) {
        next(err);
    }
};