const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

router.get('/', ratingController.getAllRatings);           // admin — all ratings
router.post('/', ratingController.submitRating);              // authenticated customer
router.get('/:cakeId/average', ratingController.getAverageRating); // public — must be before /:cakeId
router.get('/:cakeId', ratingController.getRatingsForCake);   // public — per cake

module.exports = router;