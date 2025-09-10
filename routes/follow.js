const express = require('express');
const router = express.Router();
const passport = require('passport');

const followController = require('../controllers/follow_controller');

// Follow/Unfollow routes
router.post('/toggle/:userId', passport.checkAuthentication, followController.toggleFollow);
router.post('/follow/:userId', passport.checkAuthentication, followController.follow);
router.delete('/unfollow/:userId', passport.checkAuthentication, followController.unfollow);

// Get followers and following
router.get('/followers/:userId', followController.getFollowers);
router.get('/following/:userId', followController.getFollowing);

// Get follow status and counts
router.get('/status/:userId', followController.getFollowStatus);

module.exports = router;
