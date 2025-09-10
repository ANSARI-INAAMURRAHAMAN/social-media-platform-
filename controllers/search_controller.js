const User = require('../models/user');
const Post = require('../models/post');

module.exports.searchUsers = async function(req, res) {
    try {
        const { query } = req.query;
        
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Search users by name, email, or username
        const users = await User.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { username: { $regex: query, $options: 'i' } }
            ]
        }).select('name email username avatar').limit(20);

        return res.status(200).json({
            success: true,
            message: 'Users found successfully',
            data: {
                users: users
            }
        });
    } catch (err) {
        console.log('Error searching users:', err);
        return res.status(500).json({
            success: false,
            message: 'Error searching users',
            error: err
        });
    }
};

module.exports.searchPosts = async function(req, res) {
    try {
        const { query } = req.query;
        
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        // Search posts by content
        const posts = await Post.find({
            content: { $regex: query, $options: 'i' }
        })
        .populate('user', 'name email username avatar')
        .populate({
            path: 'comments',
            populate: {
                path: 'user',
                select: 'name email username avatar'
            }
        })
        .populate('likes')
        .sort('-createdAt')
        .limit(20);

        return res.status(200).json({
            success: true,
            message: 'Posts found successfully',
            data: {
                posts: posts
            }
        });
    } catch (err) {
        console.log('Error searching posts:', err);
        return res.status(500).json({
            success: false,
            message: 'Error searching posts',
            error: err
        });
    }
};

module.exports.discoverUsers = async function(req, res) {
    try {
        // Get random users for discovery (exclude current user if authenticated)
        const excludeUserId = req.user ? req.user._id : null;
        
        const users = await User.aggregate([
            { $match: excludeUserId ? { _id: { $ne: excludeUserId } } : {} },
            { $sample: { size: 20 } },
            { $project: { name: 1, email: 1, username: 1, avatar: 1 } }
        ]);

        return res.status(200).json({
            success: true,
            message: 'Users discovered successfully',
            data: {
                users: users
            }
        });
    } catch (err) {
        console.log('Error discovering users:', err);
        return res.status(500).json({
            success: false,
            message: 'Error discovering users',
            error: err
        });
    }
};
