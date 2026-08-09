const Cake = require('../models/Cake');

exports.getAllCakes = async (req, res, next) => {
    try {
        const { name, category, minPrice, maxPrice } = req.query;

        const filter = {};
        if (name) {
            filter.name = { $regex: name, $options: 'i' }
        }
        if (category) {
            filter.category = category;
        }

        if (minPrice || maxPrice) {
            filter.price = {}
            if (minPrice) filter.price.$gte = Number(minPrice)
            if (maxPrice) filter.price.$lte = Number(maxPrice)
        }
        const cakes = await Cake.find(filter);
        res.json(cakes);
    }
    catch (err) {
        next(err);
    }
}


exports.getCakeById = async (req, res, next) => {
    try {
        const cake = await Cake.findById(req.params.id);
        if (!cake) {
            return res.status(404).json({ message: 'Cake not found' });
        }
        res.json(cake);
    }
    catch (err) {
        next(err);
    }
}


