const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../config/middleware');

const postsController = require('../controllers/posts_controller');

router.post('/create', authenticateJWT, postsController.create);
router.delete('/destroy/:id', authenticateJWT, postsController.destroy);
router.get('/destroy/:id', authenticateJWT, postsController.destroy);

module.exports = router;