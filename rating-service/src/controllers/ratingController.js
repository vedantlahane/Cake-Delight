const mongoose = require('mongoose');
const Rating = require('../models/Rating');

exports.getAllRatings = async (req, res, next) => {
    try {
        const ratings = await Rating.find().sort({ createdAt: -1 });
        res.json(ratings);
    } catch (err) {
        next(err);
    }
};

exports.submitRating = async (req, res, next) => {
    try {
        const { cakeId, userId, score, comment } = req.body;
        if (!cakeId || !userId || !score) {
            return res.status(400).json({ error: 'cakeId, userId, and score are required' });
        }
        const rating = new Rating({ cakeId, userId, score, comment });
        await rating.save();
        res.status(201).json(rating);
    }
    catch (err) {
        next(err);
    }
};

exports.getRatingsForCake = async (req, res, next) => {
    try {
        const { cakeId } = req.params;
        if (!cakeId) return res.status(400).json({ error: 'Cake ID is required' });
        const ratings = await Rating.find({ cakeId });
        res.json(ratings);
    }
    catch (err) {
        next(err);
    }
};

exports.getAverageRating = async (req, res, next) => {
    try {
        const { cakeId } = req.params;
        const result = await Rating.aggregate([
            { $match: { cakeId: new mongoose.Types.ObjectId(cakeId) } },
            { $group: { _id: '$cakeId', averageScore: { $avg: '$score' }, count: { $sum: 1 } } }
        ]);
        if (result.length === 0) {
            return res.json({ cakeId, averageScore: 0, count: 0 });
        }
        res.status(200).json({ cakeId, averageScore: result[0].averageScore, count: result[0].count });
    }
    catch (err) {
        next(err);
    }
};