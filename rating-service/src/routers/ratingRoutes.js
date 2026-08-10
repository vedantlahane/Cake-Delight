const express = require('express')
const router = express.Router()
const ratingController = require('../controllers/ratingController')


router.post('/', ratingController.submitRating)
router.get('/:cakeId', ratingController.getRatingsForCake)
router.get('/:cakeId/average', ratingController.getAverageRating)