const Story = require('../models/story');
const User = require('../models/user');
const fs = require('fs');
const path = require('path');

// Create a new story
module.exports.create = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Handle media upload
        Story.uploadStoryMedia(req, res, async function(err) {
            if (err) {
                console.log('Story Upload Error:', err);
                
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size is 50MB for videos.'
                    });
                }
                
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading media',
                    error: err.message
                });
            }

            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'Media file is required'
                    });
                }

                // Determine media type and path
                const mediaType = req.file.mimetype.startsWith('video/') ? 'video' : 'image';
                const mediaPath = mediaType === 'video' 
                    ? Story.videoPath + '/' + req.file.filename
                    : Story.imagePath + '/' + req.file.filename;

                let storyData = {
                    user: req.user._id,
                    mediaType: mediaType,
                    mediaUrl: mediaPath,
                    text: req.body.text || ''
                };

                // For videos, you might want to generate thumbnail later
                // This is a placeholder - you'd use ffmpeg or similar
                if (mediaType === 'video') {
                    // TODO: Generate thumbnail using ffmpeg
                    // storyData.thumbnail = generateThumbnail(req.file.path);
                }

                let story = await Story.create(storyData);
                story = await story.populate('user', 'name email avatar');

                return res.status(201).json({
                    success: true,
                    message: 'Story created successfully!',
                    data: {
                        story: story
                    }
                });

            } catch (error) {
                console.error('Error creating story:', error);
                
                // Clean up uploaded file if story creation fails
                if (req.file) {
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (unlinkError) {
                        console.error('Error deleting file:', unlinkError);
                    }
                }
                
                return res.status(500).json({
                    success: false,
                    message: 'Error creating story',
                    error: error.message
                });
            }
        });

    } catch (error) {
        console.error('Story creation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Get stories from followed users + own stories
module.exports.getStories = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Get user's following list using Friendship model
        const Friendship = require('../models/friendship');
        const followingFriendships = await Friendship.find({
            from_user: req.user._id,
            status: 'accepted'
        }).populate('to_user', '_id');
        
        const followingIds = followingFriendships.map(friendship => friendship.to_user._id);
        
        // Include user's own stories
        followingIds.push(req.user._id);

        // Get active stories from followed users
        const stories = await Story.find({
            user: { $in: followingIds },
            isActive: true,
            expiresAt: { $gt: new Date() }
        })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 });

        // Group stories by user
        const storiesByUser = {};
        stories.forEach(story => {
            const userId = story.user._id.toString();
            if (!storiesByUser[userId]) {
                storiesByUser[userId] = {
                    user: story.user,
                    stories: []
                };
            }
            storiesByUser[userId].stories.push(story);
        });

        return res.status(200).json({
            success: true,
            data: {
                storiesByUser: Object.values(storiesByUser)
            }
        });

    } catch (error) {
        console.error('Error fetching stories:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching stories',
            error: error.message
        });
    }
};

// Get specific user's stories
module.exports.getUserStories = async function(req, res) {
    try {
        const userId = req.params.userId;
        
        const stories = await Story.find({
            user: userId,
            isActive: true,
            expiresAt: { $gt: new Date() }
        })
        .populate('user', 'name email avatar')
        .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                stories: stories
            }
        });

    } catch (error) {
        console.error('Error fetching user stories:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching user stories',
            error: error.message
        });
    }
};

// Mark story as viewed
module.exports.viewStory = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const storyId = req.params.storyId;
        const story = await Story.findById(storyId);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        if (story.isExpired()) {
            return res.status(410).json({
                success: false,
                message: 'Story has expired'
            });
        }

        await story.addView(req.user._id);

        return res.status(200).json({
            success: true,
            message: 'Story viewed successfully'
        });

    } catch (error) {
        console.error('Error viewing story:', error);
        return res.status(500).json({
            success: false,
            message: 'Error viewing story',
            error: error.message
        });
    }
};

// Delete a story
module.exports.delete = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const storyId = req.params.storyId;
        const story = await Story.findById(storyId);

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check if user owns the story
        if (story.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this story'
            });
        }

        // Delete the media file
        try {
            const mediaPath = path.join(__dirname, '..', story.mediaUrl);
            if (fs.existsSync(mediaPath)) {
                fs.unlinkSync(mediaPath);
            }
            
            // Delete thumbnail if exists
            if (story.thumbnail) {
                const thumbnailPath = path.join(__dirname, '..', story.thumbnail);
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                }
            }
        } catch (fileError) {
            console.error('Error deleting story files:', fileError);
            // Continue with story deletion even if file deletion fails
        }

        await Story.findByIdAndDelete(storyId);

        return res.status(200).json({
            success: true,
            message: 'Story deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting story:', error);
        return res.status(500).json({
            success: false,
            message: 'Error deleting story',
            error: error.message
        });
    }
};

// Get story analytics (views, etc.)
module.exports.getStoryAnalytics = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const storyId = req.params.storyId;
        const story = await Story.findById(storyId)
            .populate('views.user', 'name email avatar');

        if (!story) {
            return res.status(404).json({
                success: false,
                message: 'Story not found'
            });
        }

        // Check if user owns the story
        if (story.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view story analytics'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                storyId: story._id,
                totalViews: story.views.length,
                views: story.views,
                createdAt: story.createdAt,
                expiresAt: story.expiresAt
            }
        });

    } catch (error) {
        console.error('Error fetching story analytics:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching story analytics',
            error: error.message
        });
    }
};
