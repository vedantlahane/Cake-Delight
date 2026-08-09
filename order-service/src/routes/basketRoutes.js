const express = require('express')
const router = express.Router()
const basketController = require('../controllers/basketController')

router.get('/:userId', basketController.getBasket)
router.post('/:userId/items', basketController.addItem);

module.exports = router