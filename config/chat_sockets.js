
const { Chat, Message } = require('../models/chat');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

module.exports.chatSockets = function(socketServer){
    let io = require('socket.io')(socketServer, {
        cors: {
            origin: "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware to authenticate socket connections
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
            const user = await User.findById(decoded._id || decoded.id);
            
            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.sockets.on('connection', function(socket){
        console.log('New authenticated connection:', socket.user.name, socket.id);

        // Join user to their personal room for notifications
        socket.join(`user_${socket.userId}`);

        socket.on('disconnect', function(){
            console.log('Socket disconnected:', socket.user.name);
        });

        // Join a specific chat room
        socket.on('join_chat', async function(data){
            try {
                const { chatId } = data;
                
                // Verify user is participant in this chat
                const chat = await Chat.findById(chatId);
                if (!chat || !chat.participants.includes(socket.userId)) {
                    socket.emit('error', { message: 'Access denied to this chat' });
                    return;
                }

                socket.join(chatId);
                console.log(`${socket.user.name} joined chat ${chatId}`);
                
                // Notify other participants that user is online
                socket.to(chatId).emit('user_online', {
                    userId: socket.userId,
                    userName: socket.user.name
                });

            } catch (error) {
                console.error('Error joining chat:', error);
                socket.emit('error', { message: 'Error joining chat' });
            }
        });

        // Leave a chat room
        socket.on('leave_chat', function(data){
            const { chatId } = data;
            socket.leave(chatId);
            
            // Notify other participants that user is offline
            socket.to(chatId).emit('user_offline', {
                userId: socket.userId,
                userName: socket.user.name
            });
            
            console.log(`${socket.user.name} left chat ${chatId}`);
        });

        // Handle sending messages
        socket.on('send_message', async function(data){
            try {
                const { chatId, content, messageType = 'text' } = data;

                // Verify user is participant in this chat
                const chat = await Chat.findById(chatId);
                if (!chat || !chat.participants.includes(socket.userId)) {
                    socket.emit('error', { message: 'Access denied to this chat' });
                    return;
                }

                // Create message in database
                const message = await Message.create({
                    chatId,
                    sender: socket.userId,
                    content: content.trim(),
                    messageType,
                    readBy: [{
                        user: socket.userId,
                        readAt: new Date()
                    }]
                });

                // Populate sender info
                await message.populate('sender', 'name username avatar');

                // Broadcast message to all participants in the chat
                io.in(chatId).emit('receive_message', {
                    message: message,
                    chatId: chatId
                });

                console.log(`Message sent in chat ${chatId} by ${socket.user.name}`);

            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Error sending message' });
            }
        });

        // Handle typing indicators
        socket.on('typing_start', function(data){
            const { chatId } = data;
            socket.to(chatId).emit('user_typing', {
                userId: socket.userId,
                userName: socket.user.name
            });
        });

        socket.on('typing_stop', function(data){
            const { chatId } = data;
            socket.to(chatId).emit('user_stop_typing', {
                userId: socket.userId,
                userName: socket.user.name
            });
        });

        // Handle message read receipts
        socket.on('mark_messages_read', async function(data){
            try {
                const { chatId } = data;
                
                // Mark messages as read
                await Message.updateMany(
                    { 
                        chatId, 
                        sender: { $ne: socket.userId },
                        'readBy.user': { $ne: socket.userId }
                    },
                    { 
                        $push: { 
                            readBy: { 
                                user: socket.userId,
                                readAt: new Date()
                            }
                        }
                    }
                );

                // Notify other participants
                socket.to(chatId).emit('messages_read', {
                    userId: socket.userId,
                    chatId: chatId
                });

            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });
    });
};