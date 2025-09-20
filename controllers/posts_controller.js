const Post = require('../models/post');
const Comment = require('../models/comment');
const Like = require('../models/like');
const fs = require('fs');
const path = require('path');
const { uploadImage, deleteFile, getPublicIdFromUrl } = require('../config/cloudinary');

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

                // Upload image to Cloudinary if file was uploaded
                if (req.file) {
                    try {
                        const cloudinaryResult = await uploadImage(req.file, 'instagram-clone/posts');
                        postData.image = cloudinaryResult.secure_url;
                        
                        // Clean up local file after upload
                        fs.unlinkSync(req.file.path);
                    } catch (cloudinaryError) {
                        console.error('Cloudinary upload error:', cloudinaryError);
                        // Clean up local file
                        if (req.file && req.file.path) {
                            try {
                                fs.unlinkSync(req.file.path);
                            } catch (unlinkError) {
                                console.error('Error deleting local file:', unlinkError);
                            }
                        }
                        return res.status(500).json({
                            success: false,
                            message: 'Error uploading image to cloud storage',
                            error: cloudinaryError.message
                        });
                    }
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

        // Delete associated image from Cloudinary if exists
        if (post.image) {
            try {
                // Extract public_id from Cloudinary URL
                const urlParts = post.image.split('/');
                const filename = urlParts[urlParts.length - 1];
                const publicId = `instagram-clone/posts/${filename.split('.')[0]}`;
                
                await deleteFile(publicId, 'image');
                console.log('Post image deleted from Cloudinary:', publicId);
            } catch (cloudinaryErr) {
                console.log('Error deleting post image from Cloudinary:', cloudinaryErr);
                // Continue with post deletion even if Cloudinary deletion fails
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