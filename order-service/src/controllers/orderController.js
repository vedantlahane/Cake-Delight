const Order = require('../models/Order');
const Basket = require('../models/Basket');
const { publishOrderCompleted } = require('../services/eventPublisher');

exports.getAllOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        next(err);
    }
};

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