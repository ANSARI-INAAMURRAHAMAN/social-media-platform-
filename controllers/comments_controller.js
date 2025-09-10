const Comment = require('../models/comment');
const Post = require('../models/post');
const commentsMailer = require('../mailers/comments_mailer');
// Temporarily disable Redis queue
// const queue = require('../config/kue');
// const commentEmailWorker = require('../workers/comment_email_worker');
const Like = require('../models/like');

module.exports.create = async function(req, res){

    try{
        let post = await Post.findById(req.body.post);

        if (post){
            let comment = await Comment.create({
                content: req.body.content,
                post: req.body.post,
                user: req.user._id
            });

            post.comments.push(comment);
            post.save();
            
            comment = await comment.populate('user', 'name email');
            
            // Send email directly without Redis queue
            try {
                commentsMailer.newComment(comment);
                console.log('Email sent for new comment');
            } catch (emailErr) {
                console.log('Error sending email:', emailErr);
            }

            // Temporarily disabled Redis queue
            // let job = queue.create('emails', comment).save(function(err){
            //     if (err){
            //         console.log('Error in sending to the queue', err);
            //         return;
            //     }
            //     console.log('job enqueued', job.id);
            // })

            return res.status(201).json({
                success: true,
                message: "Comment created successfully!",
                data: {
                    comment: comment
                }
            });
        } else {
            return res.status(404).json({
                success: false,
                message: 'Post not found'
            });
        }
    }catch(err){
        console.log('Error creating comment:', err);
        return res.status(500).json({
            success: false,
            message: 'Error creating comment',
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

        let comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({
                success: false,
                message: 'Comment not found'
            });
        }

        if (comment.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized to delete this comment'
            });
        }

        let postId = comment.post;

        // Remove comment
        await comment.remove();

        // Update post to remove comment reference
        await Post.findByIdAndUpdate(postId, { $pull: {comments: req.params.id}});

        // Delete associated likes for this comment
        await Like.deleteMany({likeable: comment._id, onModel: 'Comment'});

        return res.status(200).json({
            success: true,
            message: "Comment deleted successfully",
            data: {
                comment_id: req.params.id
            }
        });

    }catch(err){
        console.log('Error deleting comment:', err);
        return res.status(500).json({
            success: false,
            message: 'Error deleting comment',
            error: err
        });
    }
}