const mongoose = require('mongoose');

const friendshipSchema = new mongoose.Schema({
    // the user who is following (follower)
    from_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // the user being followed (following)
    to_user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // status can be 'pending', 'accepted', or 'blocked'
    // for Instagram-like follow, we'll mostly use 'accepted'
    status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'accepted'
    }
},{
    timestamps: true
});

// Ensure a user can't follow the same person twice
friendshipSchema.index({ from_user: 1, to_user: 1 }, { unique: true });

// Static method to check if user1 follows user2
friendshipSchema.statics.isFollowing = async function(fromUserId, toUserId) {
    const friendship = await this.findOne({
        from_user: fromUserId,
        to_user: toUserId,
        status: 'accepted'
    });
    return !!friendship;
};

// Static method to get followers count
friendshipSchema.statics.getFollowersCount = async function(userId) {
    return await this.countDocuments({
        to_user: userId,
        status: 'accepted'
    });
};

// Static method to get following count
friendshipSchema.statics.getFollowingCount = async function(userId) {
    return await this.countDocuments({
        from_user: userId,
        status: 'accepted'
    });
};

const Friendship = mongoose.model('Friendship', friendshipSchema);
module.exports = Friendship;
