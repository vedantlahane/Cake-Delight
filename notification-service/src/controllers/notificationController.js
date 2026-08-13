const Notification = require('../models/Notification');

/**
 * Retrieves all notifications from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
exports.getAllNotifications = async (req, res, next) => {
    try {
        const notifications = await Notification.find().sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        next(err);
    }
};

/**
 * Retrieves the status of notifications for a specific user.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
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
