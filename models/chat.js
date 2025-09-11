const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    lastActivity: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure only 2 participants per chat for direct messaging
chatSchema.pre('save', function(next) {
    if (this.participants.length !== 2) {
        return next(new Error('Direct chat must have exactly 2 participants'));
    }
    next();
});

// Static method to find or create a chat between two users
chatSchema.statics.findOrCreateChat = async function(user1Id, user2Id) {
    // Sort user IDs to ensure consistent chat finding regardless of order
    const sortedIds = [user1Id, user2Id].sort();
    
    let chat = await this.findOne({
        participants: { $all: sortedIds, $size: 2 }
    }).populate('participants', 'name username avatar')
      .populate('lastMessage');
    
    if (!chat) {
        chat = await this.create({
            participants: sortedIds
        });
        chat = await this.findById(chat._id)
            .populate('participants', 'name username avatar')
            .populate('lastMessage');
    }
    
    return chat;
};

const messageSchema = new mongoose.Schema({
    chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image'],
        default: 'text'
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }]
}, {
    timestamps: true
});

// Update chat's lastMessage and lastActivity when a new message is created
messageSchema.post('save', async function() {
    await mongoose.model('Chat').findByIdAndUpdate(this.chatId, {
        lastMessage: this._id,
        lastActivity: new Date()
    });
});

const Chat = mongoose.model('Chat', chatSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Chat, Message };
