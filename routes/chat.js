const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../config/middleware');

const chatController = require('../controllers/chat_controller');

// Get all chats for authenticated user
router.get('/', authenticateJWT, chatController.getUserChats);

// Get users that can be chatted with (followers/following)
router.get('/chatable-users', authenticateJWT, chatController.getChatableUsers);

// Create or get existing chat with a user
router.post('/create/:userId', authenticateJWT, chatController.createOrGetChat);

// Get messages for a specific chat
router.get('/:chatId/messages', authenticateJWT, chatController.getChatMessages);

// Send a message to a chat
router.post('/:chatId/messages', authenticateJWT, chatController.sendMessage);

module.exports = router;