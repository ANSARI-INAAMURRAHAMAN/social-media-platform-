const geminiAI = require('../services/gemini_ai_service');

// Generate story caption
module.exports.generateStoryCaption = async function(req, res) {
    try {
        const { mediaType, userInput } = req.body;
        
        if (!mediaType || !['image', 'video'].includes(mediaType)) {
            return res.status(400).json({
                success: false,
                message: 'Valid mediaType (image/video) is required'
            });
        }

        const result = await geminiAI.generateStoryCaption(mediaType, userInput);
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in generateStoryCaption:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate story caption',
            error: error.message
        });
    }
};

// Generate post content
module.exports.generatePostContent = async function(req, res) {
    try {
        const { userInput, mediaType } = req.body;
        
        if (!userInput || userInput.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User input is required'
            });
        }

        const result = await geminiAI.generatePostContent(userInput, mediaType || 'image');
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in generatePostContent:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate post content',
            error: error.message
        });
    }
};

// Generate caption suggestions
module.exports.generateCaptionSuggestions = async function(req, res) {
    try {
        const { theme, mediaType } = req.body;
        
        if (!theme || theme.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Theme is required'
            });
        }

        const result = await geminiAI.generateCaptionSuggestions(theme, mediaType || 'image');
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in generateCaptionSuggestions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate caption suggestions',
            error: error.message
        });
    }
};

// Generate hashtags
module.exports.generateHashtags = async function(req, res) {
    try {
        const { content, category } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Content is required'
            });
        }

        const result = await geminiAI.generateHashtags(content, category || 'general');
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in generateHashtags:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to generate hashtags',
            error: error.message
        });
    }
};

// Test AI connection
module.exports.testAI = async function(req, res) {
    try {
        const result = await geminiAI.testConnection();
        
        return res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in testAI:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to test AI connection',
            error: error.message
        });
    }
};

// Get AI suggestions for different content types
module.exports.getAISuggestions = async function(req, res) {
    try {
        const { type, input, mediaType } = req.body;
        let result;

        switch (type) {
            case 'story':
                result = await geminiAI.generateStoryCaption(mediaType || 'image', input);
                break;
            case 'post':
                result = await geminiAI.generatePostContent(input, mediaType || 'image');
                break;
            case 'suggestions':
                result = await geminiAI.generateCaptionSuggestions(input, mediaType || 'image');
                break;
            case 'hashtags':
                result = await geminiAI.generateHashtags(input);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid suggestion type. Use: story, post, suggestions, or hashtags'
                });
        }

        return res.status(200).json({
            success: true,
            data: result,
            type: type
        });
    } catch (error) {
        console.error('Error in getAISuggestions:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to get AI suggestions',
            error: error.message
        });
    }
};
