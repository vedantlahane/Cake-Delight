const mongoose = require('mongoose');

const orderItemScheme = new mongoose.Schema({
    cakeId: {
        type: mongosse.Schema.Types.ObjectId,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    quantity:{
        type: Number,
        required: true,
    }
}, _id: false);

const orderScheme = new mongoose.Schema({
    userId: {
        type: String, required: true
    },
    items: [orderItemSchema],
    total: {
        type: Number,
        required: true
    },
    status:{
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    }
}, timestamps: true);

module.exports = mongoose.model('Order', orderScheme);