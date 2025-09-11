# Chat System Test Guide

## Quick Testing Steps

### 1. **Start the Backend**
```bash
cd d:\Instagram
npm start
```
- Main server: http://localhost:8000
- Chat server: http://localhost:5001 (auto-starts)

### 2. **Start the Frontend**
```bash
cd d:\Instagram\frontend
npm run dev
```
- Frontend: http://localhost:3000

### 3. **Test the Chat System**

#### **Setup Users**:
1. Create/login with two user accounts
2. Make sure users follow each other (mutual follow)
3. Note: Only users who follow each other can chat

#### **Access Chat**:
1. Click the 💬 (Chat) icon in bottom navigation
2. Or use the "💬 Message" button on user profiles
3. Or use the 💬 button in follower/following lists

#### **Test Features**:
- ✅ **Start New Chat**: Click + button, select a user
- ✅ **Send Messages**: Type and press Enter or click Send
- ✅ **Real-time Delivery**: Open chat on both accounts
- ✅ **Typing Indicators**: Start typing to see indicator
- ✅ **Follow Restriction**: Try chatting with non-followers (should fail)
- ✅ **Chat History**: Messages persist between sessions
- ✅ **User Relationship**: Check badges (mutual/following/follower)

### 4. **Troubleshooting**

#### **If Chat Not Working**:
1. **Check JWT Token**: Make sure users are logged in
2. **Check Follow Status**: Users must follow each other
3. **Check Console**: Look for error messages
4. **Check Network**: Verify socket connection (green dot)

#### **Common Issues**:
- **"Failed to start chat"**: Users don't follow each other
- **Socket connection failed**: Check if chat server is running on port 5001
- **Messages not sending**: Check authentication token

#### **Required Environment**:
- Node.js with Express server
- MongoDB running
- Socket.io connection established
- JWT authentication working

### 5. **API Testing (Optional)**

#### **Test Chat API Endpoints**:
```bash
# Get user chats
GET /chat/
Authorization: Bearer <jwt_token>

# Get chatable users
GET /chat/chatable-users
Authorization: Bearer <jwt_token>

# Create chat with user
POST /chat/create/:userId
Authorization: Bearer <jwt_token>

# Get chat messages
GET /chat/:chatId/messages
Authorization: Bearer <jwt_token>

# Send message
POST /chat/:chatId/messages
Content-Type: application/json
Authorization: Bearer <jwt_token>
{
  "content": "Hello!",
  "messageType": "text"
}
```

### 6. **Expected Behavior**

#### **Successful Chat Flow**:
1. User A follows User B
2. User B follows User A (mutual follow)
3. Either user can start a chat
4. Real-time messaging works
5. Messages are saved to database
6. Read receipts and typing indicators work

#### **Restricted Access**:
1. Users who don't follow each other cannot chat
2. Only chat participants can see messages
3. Authentication required for all chat operations

### 7. **Browser Console Commands**

#### **Check Socket Connection**:
```javascript
// In browser console
localStorage.getItem('token') // Should return JWT token
```

#### **Manual Socket Test**:
```javascript
// Connect to socket manually
const socket = io('http://localhost:5001', {
  auth: { token: localStorage.getItem('token') }
});

socket.on('connect', () => console.log('Connected to chat'));
socket.on('error', (err) => console.log('Error:', err));
```

This chat system integrates seamlessly with the existing Instagram clone's authentication and follow system, providing a secure and feature-rich messaging experience.
