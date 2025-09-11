const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Storage paths for stories
const STORY_IMAGE_PATH = path.join('/uploads/stories/images');
const STORY_VIDEO_PATH = path.join('/uploads/stories/videos');

const storySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    mediaType: {
        type: String,
        enum: ['image', 'video'],
        required: true
    },
    mediaUrl: {
        type: String,
        required: true
    },
    thumbnail: {
        type: String, // For video stories, we'll generate/store thumbnail
    },
    text: {
        type: String,
        maxlength: 500
    },
    duration: {
        type: Number,
        default: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    },
    views: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        viewedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: function() {
            return new Date(Date.now() + this.duration);
        }
    }
}, {
    timestamps: true
});

// Index for automatic expiry
storySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Multer configuration for story media (images and videos)
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadPath;
        if (file.mimetype.startsWith('video/')) {
            uploadPath = path.join(__dirname, '..', STORY_VIDEO_PATH);
        } else {
            uploadPath = path.join(__dirname, '..', STORY_IMAGE_PATH);
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter for both images and videos
const fileFilter = (req, file, cb) => {
    // Accept images
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    // Accept videos (mp4, mov, avi, etc.)
    else if (file.mimetype.startsWith('video/')) {
        // Check file size for videos (limit to 50MB)
        cb(null, true);
    } else {
        cb(new Error('Only image and video files are allowed!'), false);
    }
};

// Multer upload configuration
storySchema.statics.uploadStoryMedia = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for videos
    }
}).single('storyMedia');

// Static paths
storySchema.statics.imagePath = STORY_IMAGE_PATH;
storySchema.statics.videoPath = STORY_VIDEO_PATH;

// Method to check if story is expired
storySchema.methods.isExpired = function() {
    return Date.now() > this.expiresAt;
};

// Method to add view
storySchema.methods.addView = function(userId) {
    // Check if user already viewed this story
    const existingView = this.views.find(view => view.user.toString() === userId.toString());
    
    if (!existingView) {
        this.views.push({ user: userId });
        return this.save();
    }
    return Promise.resolve(this);
};

// Static method to clean up expired stories
storySchema.statics.cleanupExpiredStories = async function() {
    const fs = require('fs');
    const expiredStories = await this.find({ 
        expiresAt: { $lt: new Date() },
        isActive: true 
    });

    for (let story of expiredStories) {
        try {
            // Delete the media file
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
            
            // Mark as inactive instead of deleting (for analytics)
            story.isActive = false;
            await story.save();
        } catch (error) {
            console.error('Error cleaning up story:', error);
        }
    }
    
    return expiredStories.length;
};

const Story = mongoose.model('Story', storySchema);
module.exports = Story;
