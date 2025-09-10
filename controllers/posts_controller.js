const Post = require('../models/post');
const Comment = require('../models/comment');
const Like = require('../models/like');
const fs = require('fs');
const path = require('path');

module.exports.create = async function(req, res){
    try{
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Handle image upload
        Post.uploadedImage(req, res, async function(err){
            if (err) {
                console.log('*****Multer Error: ', err);
                return res.status(400).json({
                    success: false,
                    message: 'Error uploading image',
                    error: err.message
                });
            }

            try {
                let postData = {
                    content: req.body.content,
                    user: req.user._id
                };

                // Add image path if file was uploaded
                if (req.file) {
                    postData.image = Post.imagePath + '/' + req.file.filename;
                }

                let post = await Post.create(postData);
                
                // Populate the user details
                post = await post.populate('user', 'name email');
                
                return res.status(201).json({
                    success: true,
                    message: "Post created successfully!",
                    data: {
                        post: post
                    }
                });

            } catch(err) {
                console.log('Error creating post:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Error creating post',
                    error: err
                });
            }
        });

    }catch(err){
        console.log('Error in post creation:', err);
        return res.status(500).json({
            success: false,
            message: 'Error creating post',
            error: err
        });
    }
}

module.exports.destroy = async function(req, res){
    try{
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        let post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }

        if (post.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'You cannot delete this post!'
            });
        }

        // Delete associated image file if exists
        if (post.image) {
            try {
                const imagePath = path.join(__dirname, '..', post.image);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('Post image deleted:', post.image);
                }
            } catch (fileErr) {
                console.log('Error deleting post image:', fileErr);
            }
        }

        // Delete the associated likes for the post and all its comments' likes too
        await Like.deleteMany({likeable: post._id, onModel: 'Post'});
        await Like.deleteMany({_id: {$in: post.comments}});

        // Delete all comments associated with this post
        await Comment.deleteMany({post: req.params.id});

        // Delete the post using findByIdAndDelete instead of deprecated remove()
        await Post.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: "Post and associated comments deleted successfully",
            data: {
                post_id: req.params.id
            }
        });

    }catch(err){
        console.log('Error deleting post:', err);
        return res.status(500).json({
            success: false,
            message: 'Error deleting post',
            error: err
        });
    }
}