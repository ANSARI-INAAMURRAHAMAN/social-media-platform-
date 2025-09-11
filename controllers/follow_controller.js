const Friendship = require('../models/friendship');
const User = require('../models/user');
const mongoose = require('mongoose');

// Follow a user
module.exports.follow = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Check if trying to follow themselves
        if (currentUserId.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow yourself'
            });
        }

        // Check if target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already following
        const existingFriendship = await Friendship.findOne({
            from_user: currentUserId,
            to_user: userId
        });

        if (existingFriendship) {
            return res.status(400).json({
                success: false,
                message: 'Already following this user'
            });
        }

        // Create new friendship (follow relationship)
        await Friendship.create({
            from_user: currentUserId,
            to_user: userId,
            status: 'accepted'
        });

        return res.status(200).json({
            success: true,
            message: 'Successfully followed user'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error following user',
            error: error
        });
    }
};

// Unfollow a user
module.exports.unfollow = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Find and remove the friendship
        const friendship = await Friendship.findOneAndDelete({
            from_user: currentUserId,
            to_user: userId
        });

        if (!friendship) {
            return res.status(400).json({
                success: false,
                message: 'You are not following this user'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Successfully unfollowed user'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error unfollowing user',
            error: error
        });
    }
};

// Get user's followers
module.exports.getFollowers = async function(req, res) {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const followers = await Friendship.find({
            to_user: userId,
            status: 'accepted'
        })
        .populate('from_user', 'name email username avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

        const totalFollowers = await Friendship.getFollowersCount(userId);

        return res.status(200).json({
            success: true,
            message: 'Followers fetched successfully',
            data: {
                followers: followers.map(f => f.from_user),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalFollowers / limit),
                    totalFollowers: totalFollowers,
                    hasMore: page * limit < totalFollowers
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching followers',
            error: error
        });
    }
};

// Get user's following
module.exports.getFollowing = async function(req, res) {
    try {
        const { userId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const following = await Friendship.find({
            from_user: userId,
            status: 'accepted'
        })
        .populate('to_user', 'name email username avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(limit);

        const totalFollowing = await Friendship.getFollowingCount(userId);

        return res.status(200).json({
            success: true,
            message: 'Following fetched successfully',
            data: {
                following: following.map(f => f.to_user),
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalFollowing / limit),
                    totalFollowing: totalFollowing,
                    hasMore: page * limit < totalFollowing
                }
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching following',
            error: error
        });
    }
};

// Get follow status and counts for a user
module.exports.getFollowStatus = async function(req, res) {
    try {
        const { userId } = req.params;
        const currentUserId = req.user ? req.user._id : null;

        // Get follower and following counts
        const followersCount = await Friendship.getFollowersCount(userId);
        const followingCount = await Friendship.getFollowingCount(userId);

        let isFollowing = false;
        let isFollowedBy = false;

        if (currentUserId) {
            // Check if current user follows this user
            isFollowing = await Friendship.isFollowing(currentUserId, userId);
            // Check if this user follows current user
            isFollowedBy = await Friendship.isFollowing(userId, currentUserId);
        }

        return res.status(200).json({
            success: true,
            message: 'Follow status fetched successfully',
            data: {
                userId: userId,
                followersCount: followersCount,
                followingCount: followingCount,
                isFollowing: isFollowing,
                isFollowedBy: isFollowedBy
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching follow status',
            error: error
        });
    }
};

// Toggle follow/unfollow
module.exports.toggleFollow = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Validate userId parameter
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        // Check if trying to follow themselves
        if (currentUserId.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow yourself'
            });
        }

        // Check if target user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already following
        const existingFriendship = await Friendship.findOne({
            from_user: currentUserId,
            to_user: userId
        });

        if (existingFriendship) {
            // Unfollow
            const deleteResult = await Friendship.findOneAndDelete({
                from_user: currentUserId,
                to_user: userId
            });

            return res.status(200).json({
                success: true,
                message: 'Successfully unfollowed user',
                data: {
                    action: 'unfollowed',
                    isFollowing: false
                }
            });
        } else {
            // Follow
            const newFriendship = await Friendship.create({
                from_user: currentUserId,
                to_user: userId,
                status: 'accepted'
            });

            return res.status(200).json({
                success: true,
                message: 'Successfully followed user',
                data: {
                    action: 'followed',
                    isFollowing: true
                }
            });
        }

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error toggling follow',
            error: error.message
        });
    }
};
