const Cake = require('../models/Cake');

exports.getAllCakes = async (req, res, next) => {
    try {
        const { name, category, minPrice, maxPrice } = req.query;

        const filter = {};
        if (name) {
            filter.name = { $regex: name, $options: 'i' };
        }
        if (category) {
            filter.category = { $regex: category, $options: 'i' };
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        const cakes = await Cake.find(filter).sort({ createdAt: -1 });
        res.json(cakes);
    } catch (err) {
        next(err);
    }
};

exports.getCakeById = async (req, res, next) => {
    try {
        const cake = await Cake.findById(req.params.id);
        if (!cake) {
            return res.status(404).json({ message: 'Cake not found' });
        }
        res.json(cake);
    } catch (err) {
        next(err);
    }
};

exports.createCake = async (req, res, next) => {
    try {
        const { name, description, category, price, imageUrl, available } = req.body;
        if (!name || !category || price == null) {
            return res.status(400).json({ error: 'name, category, and price are required' });
        }
        const cake = new Cake({
            name,
            description: description || '',
            category,
            price: Number(price),
            imageUrl: imageUrl || '',
            available: available !== false
        });
        await cake.save();
        res.status(201).json(cake);
    } catch (err) {
        next(err);
    }
};

exports.updateCake = async (req, res, next) => {
    try {
        const { name, description, category, price, imageUrl, available } = req.body;
        const update = {};
        if (name !== undefined) update.name = name;
        if (description !== undefined) update.description = description;
        if (category !== undefined) update.category = category;
        if (price !== undefined) update.price = Number(price);
        if (imageUrl !== undefined) update.imageUrl = imageUrl;
        if (available !== undefined) update.available = available;

        const cake = await Cake.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!cake) return res.status(404).json({ error: 'Cake not found' });
        res.json(cake);
    } catch (err) {
        next(err);
    }
};

exports.deleteCake = async (req, res, next) => {
    try {
        const cake = await Cake.findByIdAndDelete(req.params.id);
        if (!cake) return res.status(404).json({ error: 'Cake not found' });
        res.json({ message: 'Cake deleted successfully', id: req.params.id });
    } catch (err) {
        next(err);
    }
};
