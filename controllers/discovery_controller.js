const User = require('../models/user');
const Friendship = require('../models/friendship');

// Get all users for discovery (excluding current user)
module.exports.discoverUsers = async function(req, res) {
    try {
        const currentUserId = req.user ? req.user._id : null;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const search = req.query.search || '';

        // Build search query
        let query = {};
        if (currentUserId) {
            query._id = { $ne: currentUserId }; // Exclude current user
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }

        // Get users
        const users = await User.find(query)
            .select('name email username avatar')
            .sort('-createdAt')
            .skip(skip)
            .limit(limit);

        // Get follow status for each user if current user is logged in
        let usersWithFollowStatus = [];
        if (currentUserId) {
            for (let user of users) {
                const isFollowing = await Friendship.isFollowing(currentUserId, user._id);
                const followersCount = await Friendship.getFollowersCount(user._id);
                const followingCount = await Friendship.getFollowingCount(user._id);
                
                usersWithFollowStatus.push({
                    ...user.toObject(),
                    isFollowing: isFollowing,
                    followersCount: followersCount,
                    followingCount: followingCount
                });
            }
        } else {
            usersWithFollowStatus = users.map(user => ({
                ...user.toObject(),
                isFollowing: false,
                followersCount: 0,
                followingCount: 0
            }));
        }

        const totalUsers = await User.countDocuments(query);

        return res.status(200).json({
            success: true,
            message: 'Users fetched successfully',
            data: {
                users: usersWithFollowStatus,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalUsers / limit),
                    totalUsers: totalUsers,
                    hasMore: page * limit < totalUsers
                }
            }
        });

    } catch (error) {
        console.log('Error fetching users:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error
        });
    }
};

// Get suggested users (users with most followers, recent users, etc.)
module.exports.suggestedUsers = async function(req, res) {
    try {
        const currentUserId = req.user ? req.user._id : null;
        const limit = parseInt(req.query.limit) || 10;

        // Get users that current user is not following
        let excludeUserIds = [currentUserId];
        if (currentUserId) {
            const following = await Friendship.find({
                from_user: currentUserId,
                status: 'accepted'
            }).select('to_user');
            
            const followingIds = following.map(f => f.to_user);
            excludeUserIds = [...excludeUserIds, ...followingIds];
        }

        // Get random users excluding already followed ones
        const users = await User.aggregate([
            { $match: { _id: { $nin: excludeUserIds } } },
            { $sample: { size: limit } },
            { $project: { name: 1, email: 1, username: 1, avatar: 1 } }
        ]);

        // Add follow counts
        let usersWithCounts = [];
        for (let user of users) {
            const followersCount = await Friendship.getFollowersCount(user._id);
            const followingCount = await Friendship.getFollowingCount(user._id);
            
            usersWithCounts.push({
                ...user,
                isFollowing: false,
                followersCount: followersCount,
                followingCount: followingCount
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Suggested users fetched successfully',
            data: {
                users: usersWithCounts
            }
        });

    } catch (error) {
        console.log('Error fetching suggested users:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching suggested users',
            error: error
        });
    }
};

// Search users by name, email, or username
module.exports.searchUsers = async function(req, res) {
    try {
        const currentUserId = req.user ? req.user._id : null;
        const { q: searchQuery } = req.query;
        const limit = parseInt(req.query.limit) || 15;

        if (!searchQuery || searchQuery.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters long'
            });
        }

        // Build search query
        let query = {
            $or: [
                { name: { $regex: searchQuery.trim(), $options: 'i' } },
                { email: { $regex: searchQuery.trim(), $options: 'i' } },
                { username: { $regex: searchQuery.trim(), $options: 'i' } }
            ]
        };

        if (currentUserId) {
            query._id = { $ne: currentUserId }; // Exclude current user
        }

        const users = await User.find(query)
            .select('name email username avatar')
            .limit(limit)
            .sort({ name: 1 });

        // Add follow status and counts
        let usersWithStatus = [];
        if (currentUserId) {
            for (let user of users) {
                const isFollowing = await Friendship.isFollowing(currentUserId, user._id);
                const followersCount = await Friendship.getFollowersCount(user._id);
                
                usersWithStatus.push({
                    ...user.toObject(),
                    isFollowing: isFollowing,
                    followersCount: followersCount
                });
            }
        } else {
            usersWithStatus = users.map(user => ({
                ...user.toObject(),
                isFollowing: false,
                followersCount: 0
            }));
        }

        return res.status(200).json({
            success: true,
            message: 'Search results fetched successfully',
            data: {
                users: usersWithStatus,
                query: searchQuery.trim()
            }
        });

    } catch (error) {
        console.log('Error searching users:', error);
        return res.status(500).json({
            success: false,
            message: 'Error searching users',
            error: error
        });
    }
};
