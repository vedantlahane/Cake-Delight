const Notification = require('../models/Notification');

exports.getAllNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        next(err);
    }
};

exports.getNotificationStatus = async (req, res, next) => {
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ error: 'User ID is required' });
        const notifications = await Notification.find({ userId });
        res.json(notifications);
    }
    catch (err) {
        next(err);
    }
};