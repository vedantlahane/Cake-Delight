const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
    orderId: {
        type: mongoose.Schema.Types.ObjectId, required: true
    },
    userId:{
        type: String, 
        required: true
    },
    channel:{
        type: SString,
        enum: ['email', 'sms', 'in-app'],
        default: 'email'
    },
    status:{
        type: String,
        enum:  ['pending', 'sent', 'failed'],
        default: 'pending'
    }
}, { timestamps: true});

module.exports = mongoose.model('Notification',notificationSchema);