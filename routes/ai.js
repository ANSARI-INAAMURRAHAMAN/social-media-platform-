const express = require('express');
const router = express.Router();
const passport = require('passport');

const aiController = require('../controllers/ai_controller');

// Generate story caption
router.post('/story-caption', 
    passport.authenticate('jwt', { session: false }), 
    aiController.generateStoryCaption
);

// Generate post content
router.post('/post-content', 
    passport.authenticate('jwt', { session: false }), 
    aiController.generatePostContent
);

// Generate caption suggestions
router.post('/caption-suggestions', 
    passport.authenticate('jwt', { session: false }), 
    aiController.generateCaptionSuggestions
);

// Generate hashtags
router.post('/hashtags', 
    passport.authenticate('jwt', { session: false }), 
    aiController.generateHashtags
);

// Test AI connection
router.get('/test', 
    passport.authenticate('jwt', { session: false }), 
    aiController.testAI
);

// General AI suggestions endpoint
router.post('/suggestions', 
    passport.authenticate('jwt', { session: false }), 
    aiController.getAISuggestions
);

module.exports = router;
