
const Order = require('../models/Order');

exports.getOrder = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });
        const orders = await Order.find({ userId });
        res.json(orders);
    }
    catch (err) {
        next(err);
    }
};