const { Chat, Message } = require('../models/chat');
const User = require('../models/user');
const Friendship = require('../models/friendship');

// Get all chats for the authenticated user
module.exports.getUserChats = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const chats = await Chat.find({
            participants: req.user._id
        })
        .populate('participants', 'name username avatar')
        .populate({
            path: 'lastMessage',
            populate: {
                path: 'sender',
                select: 'name username'
            }
        })
        .sort({ lastActivity: -1 });

        return res.status(200).json({
            success: true,
            data: { chats }
        });

    } catch (error) {
        console.error('Error fetching user chats:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching chats',
            error: error.message
        });
    }
};

// Get messages for a specific chat
module.exports.getChatMessages = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { chatId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // Verify user is a participant in this chat
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        if (!chat.participants.includes(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this chat'
            });
        }

        const messages = await Message.find({ chatId })
            .populate('sender', 'name username avatar')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Mark messages as read by current user
        await Message.updateMany(
            { 
                chatId, 
                sender: { $ne: req.user._id },
                'readBy.user': { $ne: req.user._id }
            },
            { 
                $push: { 
                    readBy: { 
                        user: req.user._id,
                        readAt: new Date()
                    }
                }
            }
        );

        return res.status(200).json({
            success: true,
            data: { 
                messages: messages.reverse(), // Return in chronological order
                chat
            }
        });

    } catch (error) {
        console.error('Error fetching chat messages:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching messages',
            error: error.message
        });
    }
};

// Create or get existing chat with another user
module.exports.createOrGetChat = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { userId } = req.params;
        const currentUserId = req.user._id;

        // Check if trying to chat with themselves
        if (currentUserId.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot chat with yourself'
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

        // Check if users follow each other (mutual follow required for chat)
        const userFollowsTarget = await Friendship.isFollowing(currentUserId, userId);
        const targetFollowsUser = await Friendship.isFollowing(userId, currentUserId);

        if (!userFollowsTarget && !targetFollowsUser) {
            return res.status(403).json({
                success: false,
                message: 'You can only chat with users you follow or who follow you'
            });
        }

        // Find or create chat
        const chat = await Chat.findOrCreateChat(currentUserId, userId);

        return res.status(200).json({
            success: true,
            data: { chat },
            message: 'Chat ready'
        });

    } catch (error) {
        console.error('Error creating/getting chat:', error);
        return res.status(500).json({
            success: false,
            message: 'Error creating chat',
            error: error.message
        });
    }
};

// Send a message
module.exports.sendMessage = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const { chatId } = req.params;
        const { content, messageType = 'text' } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Message content is required'
            });
        }

        // Verify chat exists and user is a participant
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        if (!chat.participants.includes(req.user._id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied to this chat'
            });
        }

        // Create message
        const message = await Message.create({
            chatId,
            sender: req.user._id,
            content: content.trim(),
            messageType,
            readBy: [{
                user: req.user._id,
                readAt: new Date()
            }]
        });

        // Populate sender info
        await message.populate('sender', 'name username avatar');

        return res.status(201).json({
            success: true,
            data: { message },
            message: 'Message sent successfully'
        });

    } catch (error) {
        console.error('Error sending message:', error);
        return res.status(500).json({
            success: false,
            message: 'Error sending message',
            error: error.message
        });
    }
};

// Get users that can be chatted with (mutual follows)
module.exports.getChatableUsers = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        const currentUserId = req.user._id;

        // Get users that current user follows
        const following = await Friendship.find({
            from_user: currentUserId,
            status: 'accepted'
        }).populate('to_user', 'name username avatar');

        // Get users that follow current user
        const followers = await Friendship.find({
            to_user: currentUserId,
            status: 'accepted'
        }).populate('from_user', 'name username avatar');

        // Combine and deduplicate
        const chatableUsers = [];
        const userIds = new Set();

        // Add users that current user follows
        following.forEach(friendship => {
            if (!userIds.has(friendship.to_user._id.toString())) {
                chatableUsers.push({
                    user: friendship.to_user,
                    relationship: 'following'
                });
                userIds.add(friendship.to_user._id.toString());
            }
        });

        // Add users that follow current user (if not already added)
        followers.forEach(friendship => {
            if (!userIds.has(friendship.from_user._id.toString())) {
                chatableUsers.push({
                    user: friendship.from_user,
                    relationship: 'follower'
                });
                userIds.add(friendship.from_user._id.toString());
            } else {
                // Update to mutual if already exists
                const existingUser = chatableUsers.find(u => 
                    u.user._id.toString() === friendship.from_user._id.toString()
                );
                if (existingUser) {
                    existingUser.relationship = 'mutual';
                }
            }
        });

        return res.status(200).json({
            success: true,
            data: { users: chatableUsers }
        });

    } catch (error) {
        console.error('Error fetching chatable users:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching chatable users',
            error: error.message
        });
    }
};