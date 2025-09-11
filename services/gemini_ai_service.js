const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAIService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }

    // Generate story caption based on image/video analysis
    async generateStoryCaption(mediaType, userInput = '') {
        try {
            let prompt = '';
            
            if (userInput) {
                // User provided some context
                prompt = `Generate a creative and engaging Instagram story caption based on this description: "${userInput}". 
                Make it ${mediaType === 'video' ? 'dynamic and action-focused' : 'visually appealing and aesthetic'}. 
                Keep it under 100 characters, use relevant emojis, and make it trendy and social media friendly.
                Don't use hashtags, just the caption text.`;
            } else {
                // General caption for media type
                prompt = `Generate a creative and engaging Instagram story caption for a ${mediaType}. 
                Make it trendy, fun, and social media friendly. 
                Keep it under 100 characters, use relevant emojis.
                Don't use hashtags, just the caption text.
                Make it general enough to work for any ${mediaType}.`;
            }

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const caption = response.text().trim();
            
            return {
                success: true,
                caption: caption,
                type: 'story'
            };
        } catch (error) {
            console.error('Error generating story caption:', error);
            return {
                success: false,
                error: 'Failed to generate caption',
                caption: this.getFallbackStoryCaption(mediaType)
            };
        }
    }

    // Generate post content based on user input
    async generatePostContent(userInput, mediaType = 'image') {
        try {
            const prompt = `Create an engaging Instagram post based on this idea: "${userInput}". 
            ${mediaType === 'video' ? 'This is for a video post.' : 'This is for an image post.'}
            
            Generate:
            1. A compelling caption (2-3 sentences, engaging and relatable)
            2. 5-8 relevant hashtags
            3. Keep it authentic and not overly promotional
            
            Format the response as:
            Caption: [your caption here]
            Hashtags: [hashtags here]
            
            Make it trendy, engaging, and suitable for a social media audience.`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const content = response.text().trim();
            
            // Parse the response to extract caption and hashtags
            const parsed = this.parsePostContent(content);
            
            return {
                success: true,
                ...parsed,
                type: 'post'
            };
        } catch (error) {
            console.error('Error generating post content:', error);
            return {
                success: false,
                error: 'Failed to generate content',
                caption: this.getFallbackPostCaption(userInput),
                hashtags: '#instagram #post #social'
            };
        }
    }

    // Generate caption suggestions for different moods/themes
    async generateCaptionSuggestions(theme, mediaType = 'image') {
        try {
            const prompt = `Generate 3 different Instagram ${mediaType === 'video' ? 'video' : 'photo'} captions for the theme: "${theme}". 
            Make them varied in style:
            1. Casual and fun
            2. Inspirational/motivational  
            3. Trendy/cool
            
            Each caption should be under 150 characters and include relevant emojis.
            Format as: "1. [caption] | 2. [caption] | 3. [caption]"`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const suggestions = response.text().trim();
            
            // Parse suggestions into array
            const captionArray = this.parseCaptionSuggestions(suggestions);
            
            return {
                success: true,
                suggestions: captionArray,
                theme: theme
            };
        } catch (error) {
            console.error('Error generating caption suggestions:', error);
            return {
                success: false,
                error: 'Failed to generate suggestions',
                suggestions: this.getFallbackSuggestions(theme)
            };
        }
    }

    // Generate hashtags based on content
    async generateHashtags(content, category = 'general') {
        try {
            const prompt = `Generate 8-12 relevant Instagram hashtags for this content: "${content}". 
            Category: ${category}
            
            Include:
            - 2-3 popular hashtags (high reach)
            - 3-4 medium-popularity hashtags (good engagement)
            - 3-4 niche hashtags (targeted audience)
            - 1-2 trending hashtags if relevant
            
            Return as a single line separated by spaces, starting each with #`;

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const hashtags = response.text().trim();
            
            return {
                success: true,
                hashtags: hashtags,
                category: category
            };
        } catch (error) {
            console.error('Error generating hashtags:', error);
            return {
                success: false,
                error: 'Failed to generate hashtags',
                hashtags: `#${category} #instagram #post #social #content`
            };
        }
    }

    // Helper methods
    parsePostContent(content) {
        const lines = content.split('\n');
        let caption = '';
        let hashtags = '';
        
        lines.forEach(line => {
            if (line.toLowerCase().includes('caption:')) {
                caption = line.replace(/caption:/i, '').trim();
            } else if (line.toLowerCase().includes('hashtags:')) {
                hashtags = line.replace(/hashtags:/i, '').trim();
            }
        });
        
        // Fallback if parsing fails
        if (!caption) {
            caption = content.split('\n')[0] || 'Check out this amazing content! ✨';
        }
        if (!hashtags) {
            hashtags = '#instagram #post #content #social';
        }
        
        return { caption, hashtags };
    }

    parseCaptionSuggestions(suggestions) {
        try {
            // Try to split by numbers and pipe
            const parts = suggestions.split('|').map(part => 
                part.replace(/^\d+\.\s*/, '').trim()
            );
            
            if (parts.length >= 3) {
                return parts.slice(0, 3);
            }
            
            // Fallback: split by newlines and take first 3
            const lines = suggestions.split('\n').filter(line => line.trim().length > 0);
            return lines.slice(0, 3).map(line => line.replace(/^\d+\.\s*/, '').trim());
        } catch (error) {
            return this.getFallbackSuggestions('general');
        }
    }

    getFallbackStoryCaption(mediaType) {
        const captions = {
            image: ['✨ Moments like these ✨', '📸 Capturing life', '✨ Just vibes ✨', '🌟 Living my best life'],
            video: ['🎬 Action mode on', '🔥 Watch this!', '🎥 Behind the scenes', '⚡ Quick moment']
        };
        
        const options = captions[mediaType] || captions.image;
        return options[Math.floor(Math.random() * options.length)];
    }

    getFallbackPostCaption(userInput) {
        return `Sharing some thoughts on ${userInput}... What do you think? 💭✨`;
    }

    getFallbackSuggestions(theme) {
        return [
            `Living for moments like these ✨ #${theme}`,
            `${theme} vibes only 🌟`,
            `Grateful for these experiences 💫 #blessed`
        ];
    }

    // Test connection to Gemini
    async testConnection() {
        try {
            const result = await this.model.generateContent("Say hello in a creative way!");
            const response = await result.response;
            return {
                success: true,
                message: response.text(),
                status: 'Connected to Gemini AI'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                status: 'Failed to connect to Gemini AI'
            };
        }
    }
}

module.exports = new GeminiAIService();
