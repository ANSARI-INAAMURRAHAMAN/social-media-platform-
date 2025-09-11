const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../config/middleware');

const activityController = require('../controllers/activity_controller');

router.get('/', authenticateJWT, activityController.getActivities);
router.post('/mark-read', authenticateJWT, activityController.markAsRead);

module.exports = router;
