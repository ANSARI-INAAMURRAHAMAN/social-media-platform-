const express = require('express');
const router = express.Router();
const passport = require('passport');

const discoveryController = require('../controllers/discovery_controller');

// User discovery routes
router.get('/users', discoveryController.discoverUsers);
router.get('/suggested', discoveryController.suggestedUsers);
router.get('/search', discoveryController.searchUsers);

module.exports = router;
