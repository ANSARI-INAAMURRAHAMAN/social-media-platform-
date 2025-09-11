const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../config/middleware');

const followController = require('../controllers/follow_controller');

// Follow/Unfollow routes
router.post('/toggle/:userId', authenticateJWT, followController.toggleFollow);
router.post('/follow/:userId', authenticateJWT, followController.follow);
router.delete('/unfollow/:userId', authenticateJWT, followController.unfollow);

// Get followers and following
router.get('/followers/:userId', followController.getFollowers);
router.get('/following/:userId', followController.getFollowing);

// Get follow status and counts (requires authentication to check if current user follows target user)
router.get('/status/:userId', authenticateJWT, followController.getFollowStatus);

module.exports = router;
