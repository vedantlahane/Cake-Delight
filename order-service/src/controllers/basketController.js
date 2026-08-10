const axios = require('axios');
const Basket = require('../models/Basket');

exports.getBasket = async (req, res, next) => {
    try {
        const basket = await Basket.findOne({
            userId: req.params.userId
        });
        res.json(basket || { userId: req.params.userId, items: [] });
    }
    catch (err) {
        next(err);
    }
};

exports.addItem = async (req, res, next) => {
    try {
        const { cakeId, quantity } = req.body;
        const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://localhost:3000';

        const catalogRes = await axios.get(
            `${catalogUrl}/cakes/${cakeId}`
        );
        const cake = catalogRes.data;

        let basket = await Basket.findOne({ userId: req.params.userId });
        if (!basket) {
            basket = new Basket({ userId: req.params.userId, items: [] });
        }

        const existingItem = basket.items.find(
            item => item.cakeId.toString() === cakeId
        );

        if (existingItem) {
            existingItem.quantity += (quantity || 1);
        }
        else {
            basket.items.push({
                cakeId,
                name: cake.name,
                price: cake.price,
                quantity: quantity || 1
            });
        }
        await basket.save();
        res.status(201).json(basket);
    }
    catch (err) {
        if (err.response && err.response.status === 404) {
            return res.status(404).json({ error: 'Cake not found in catalog' });
        }
        next(err);
    }
};

exports.updateItem = async (req, res, next) => {
    try {
        const { quantity } = req.body;
        const { userId, cakeId } = req.params;

        const basket = await Basket.findOne({ userId });
        if (!basket) return res.status(404).json({ error: 'Basket not found' });

        const itemIndex = basket.items.findIndex(item => item.cakeId.toString() === cakeId);
        if (itemIndex === -1) return res.status(404).json({ error: 'Item not in basket' });
        basket.items[itemIndex].quantity = quantity;
        await basket.save();
        res.json(basket);
    }
    catch (err) {
        next(err);
    }
};

exports.removeItem = async (req, res, next) => {
    try {
        const { userId, cakeId } = req.params;
        const basket = await Basket.findOne({ userId });
        if (!basket) return res.status(404).json({ error: 'Basket not found' });
        const originalLength = basket.items.length;
        basket.items = basket.items.filter(item => item.cakeId.toString() !== cakeId);
        if (basket.items.length === originalLength) return res.status(404).json({ error: 'Item not in basket' });
        await basket.save();
        res.json(basket);
    }
    catch (err) {
        next(err);
    }
};