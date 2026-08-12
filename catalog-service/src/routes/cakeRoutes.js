const express = require('express');
const router = express.Router();
const cakeController = require('../controllers/cakeController');

// Public routes — browsing
router.get('/', cakeController.getAllCakes);
router.get('/:id', cakeController.getCakeById);

// Admin-only routes — catalog management
// Gateway enforces adminMiddleware before proxying these
router.post('/', cakeController.createCake);
router.put('/:id', cakeController.updateCake);
router.delete('/:id', cakeController.deleteCake);

module.exports = router;
