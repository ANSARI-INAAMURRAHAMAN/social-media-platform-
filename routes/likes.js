const express = require('express');
const { authenticateJWT } = require('../config/middleware');

const router = express.Router();
const likesController = require('../controllers/likes_controller');

router.post('/toggle', authenticateJWT, likesController.toggleLike);

module.exports = router;