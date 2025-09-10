const Like = require('../models/like');
const Comment = require('../models/comment');
const User = require('../models/user');

module.exports.getActivities = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { type = 'you' } = req.query; // 'you' or 'following'
        let activities = [];

        if (type === 'you') {
            // Get activities on current user's posts
            // Find posts by current user
            const Post = require('../models/post');
            const userPosts = await Post.find({ user: req.user._id }).select('_id');
            const postIds = userPosts.map(post => post._id);

            // Get likes on user's posts
            const likes = await Like.find({
                likeable: { $in: postIds },
                onModel: 'Post',
                user: { $ne: req.user._id } // Exclude user's own likes
            })
            .populate('user', 'name email username avatar')
            .populate('likeable', 'content')
            .sort('-createdAt')
            .limit(20);

            // Get comments on user's posts
            const comments = await Comment.find({
                post: { $in: postIds },
                user: { $ne: req.user._id } // Exclude user's own comments
            })
            .populate('user', 'name email username avatar')
            .populate('post', 'content')
            .sort('-createdAt')
            .limit(20);

            // Combine and format activities
            const likeActivities = likes.map(like => ({
                _id: like._id,
                type: 'like',
                user: like.user,
                post: like.likeable,
                createdAt: like.createdAt,
                message: `${like.user.name || like.user.email} liked your post`
            }));

            const commentActivities = comments.map(comment => ({
                _id: comment._id,
                type: 'comment',
                user: comment.user,
                post: comment.post,
                comment: comment,
                createdAt: comment.createdAt,
                message: `${comment.user.name || comment.user.email} commented on your post`
            }));

            activities = [...likeActivities, ...commentActivities];
            activities.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            activities = activities.slice(0, 50);

        } else if (type === 'following') {
            // For now, return empty array as we don't have following system yet
            activities = [];
        }

        return res.status(200).json({
            success: true,
            message: 'Activities fetched successfully',
            data: {
                activities: activities
            }
        });
    } catch (err) {
        console.log('Error fetching activities:', err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching activities',
            error: err
        });
    }
};

module.exports.markAsRead = async function(req, res) {
    try {
        // This would mark activities as read in a real app
        // For now, just return success
        return res.status(200).json({
            success: true,
            message: 'Activities marked as read'
        });
    } catch (err) {
        console.log('Error marking activities as read:', err);
        return res.status(500).json({
            success: false,
            message: 'Error marking activities as read',
            error: err
        });
    }
};
