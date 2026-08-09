const mongoose = require('mongoose');

const basketItemSchema = new mongoose.Schema({
    cakeId: {
        type: mongoose.Schema.ObjectId,
        required: true
    },
    name:{
        type: String,
        required: true
    },
    price : {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    }

},{_id: false});

const backetScheme = new mongoose.Schema({
    userId: {
        type: String, required: true, unique: true
    },
    items: [basketItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Basket', backetScheme);