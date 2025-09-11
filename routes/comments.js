const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../config/middleware');

const commentsController = require('../controllers/comments_controller');

router.post('/create', authenticateJWT, commentsController.create);
router.delete('/destroy/:id', authenticateJWT, commentsController.destroy);
router.get('/destroy/:id', authenticateJWT, commentsController.destroy);

module.exports = router;