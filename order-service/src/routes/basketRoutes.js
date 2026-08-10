const express = require('express')
const router = express.Router()
const basketController = require('../controllers/basketController')

router.get('/:userId', basketController.getBasket)
router.post('/:userId/items', basketController.addItem);
router.put('/:userId/items/:cakeId', basketController.updateItem);
router.delete('/:userId/items/:cakeId', basketController.removeItem);

module.exports = router