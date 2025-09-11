const express = require('express');
const router = express.Router();
const passport = require('passport');

const storyController = require('../controllers/story_controller');

// Create a new story (requires authentication)
router.post('/create', 
    passport.authenticate('jwt', { session: false }), 
    storyController.create
);

// Get stories from followed users
router.get('/', 
    passport.authenticate('jwt', { session: false }), 
    storyController.getStories
);

// Get specific user's stories
router.get('/user/:userId', 
    storyController.getUserStories
);

// Mark story as viewed
router.post('/:storyId/view', 
    passport.authenticate('jwt', { session: false }), 
    storyController.viewStory
);

// Delete a story
router.delete('/:storyId', 
    passport.authenticate('jwt', { session: false }), 
    storyController.delete
);

// Get story analytics (views, etc.)
router.get('/:storyId/analytics', 
    passport.authenticate('jwt', { session: false }), 
    storyController.getStoryAnalytics
);

module.exports = router;
