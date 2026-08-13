const mongoose = require('mongoose');

/**
 * Defines the schema for the Notification model in MongoDB using Mongoose.
 * Each notification document contains the following fields:
 * - orderId: ObjectId reference to the associated order (required).
 * - userId: String representing the user ID (required).
 * - channel: String indicating the communication channel (email, sms, or in-app).
 * - status: String indicating the status of the notification (pending, sent, or failed).
 */
const notificationSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    channel: {
        type: String,
        enum: ['email', 'sms', 'in-app'],
        default: 'email'
    },
    status: {
        type: String,
        enum: ['pending', 'sent', 'failed'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
