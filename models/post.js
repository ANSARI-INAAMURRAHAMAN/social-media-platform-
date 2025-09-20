const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const os = require('os');
const POST_IMAGE_PATH = path.join('/uploads/posts/images');

const postSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    user: {
        type:  mongoose.Schema.Types.ObjectId,
        ref: 'User'

    },
    // include the array of ids of all comments in this post schema itself
    comments: [
        {
            type:  mongoose.Schema.Types.ObjectId,
            ref: 'Comment'
        }
    ],
    likes: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Like'
        }
    ]
},{
    timestamps: true
});

// Multer configuration for post images - using temp storage for Cloudinary
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use system temp directory for temporary files
        cb(null, os.tmpdir());
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

// Static method for uploading post images
postSchema.statics.uploadedImage = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
}).single('image');

postSchema.statics.imagePath = POST_IMAGE_PATH;

const Post = mongoose.model('Post', postSchema);
module.exports = Post;