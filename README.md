# 🚀 Social Media Platform - Full Stack MERN Application

A modern, full-featured social media platform built with Express.js backend and Next.js frontend.

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen)
![Backend](https://img.shields.io/badge/Backend-Express.js-green)
![Frontend](https://img.shields.io/badge/Frontend-Next.js-blue)
![Database](https://img.shields.io/badge/Database-MongoDB-green)

## ✨ Features

### 🔐 Authentication & Security
- **User Registration & Login** with email/password
- **Google OAuth 2.0** integration
- **JWT Token** authentication for APIs
- **Session Management** with MongoDB store
- **Password Protection** and secure routes

### 📱 Social Features
- **Home Feed** with all user posts
- **Create Posts** (text-based with image support ready)
- **Comments System** - Add/delete comments on posts
- **Like System** - Like/unlike posts and comments
- **User Profiles** - View and edit profile information
- **Avatar Uploads** - Profile picture management

### 💬 Real-time Features
- **Socket.io Chat** - Real-time messaging
- **Live Notifications** - Instant updates
- **Real-time Comments** - Live comment updates

### 📧 Email System
- **Email Notifications** for new comments
- **Gmail SMTP** integration
- **HTML Email Templates** with EJS

## 🛠️ Tech Stack

### Backend (API Server)
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - ODM for MongoDB
- **Passport.js** - Authentication middleware
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **Nodemailer** - Email sending
- **JWT** - Token-based authentication

### Frontend (Web App)
- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Socket.io-client** - Real-time client

### Development Tools
- **Nodemon** - Development server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Gmail account (for email features)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd social-media-platform
```

### 2. Backend Setup
```bash
# Install backend dependencies
npm install

# Create environment file
cp .env.example .env
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
CALLBACK_URL=http://localhost:8000/users/auth/google/callback

# Email Configuration
GMAIL_USER=your_gmail_email
GMAIL_PASS=your_gmail_app_password

# Server Configuration
PORT=8000
```

### 4. Frontend Setup
```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install
```

### 5. Start the Application
```bash
# Terminal 1: Start backend server
npm start

# Terminal 2: Start frontend (in frontend directory)
cd frontend
npm run dev
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Chat Server**: http://localhost:5000

## 📁 Project Structure

```
├── 📁 backend/
│   ├── 📁 config/          # Configuration files
│   │   ├── mongoose.js     # Database connection
│   │   ├── passport-*.js   # Authentication strategies
│   │   ├── nodemailer.js   # Email configuration
│   │   └── chat_sockets.js # Socket.io setup
│   ├── 📁 controllers/     # Route controllers
│   │   ├── users_controller.js
│   │   ├── posts_controller.js
│   │   ├── comments_controller.js
│   │   └── api/           # API controllers
│   ├── 📁 models/         # Database models
│   │   ├── user.js
│   │   ├── post.js
│   │   └── comment.js
│   ├── 📁 routes/         # Express routes
│   ├── 📁 uploads/        # File uploads
│   └── 📁 views/mailers/  # Email templates
├── 📁 frontend/
│   ├── 📁 src/app/        # Next.js pages
│   │   ├── auth/          # Authentication pages
│   │   ├── feed/          # Home feed
│   │   ├── profile/       # User profiles
│   │   └── create/        # Post creation
│   └── 📁 components/     # Reusable components
└── 📄 README.md
```

## 🔗 API Endpoints

### Authentication
- `POST /users/create` - User registration
- `POST /users/create-session` - Login
- `POST /users/destroy-session` - Logout
- `GET /users/auth/google` - Google OAuth

### Posts
- `GET /` - Get home feed
- `POST /posts/create` - Create post
- `DELETE /posts/destroy/:id` - Delete post

### Comments
- `POST /comments/create` - Add comment
- `DELETE /comments/destroy/:id` - Delete comment

### Likes
- `POST /likes/toggle` - Toggle like

### File Uploads
- `POST /users/update/:id` - Update profile with avatar

## 🚀 Deployment

### Backend Deployment (Heroku/Railway)
1. Set environment variables
2. Configure MongoDB Atlas whitelist
3. Update CORS origins for production
4. Deploy with build scripts

### Frontend Deployment (Vercel/Netlify)
1. Update API endpoints for production
2. Configure environment variables
3. Build and deploy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Authors

- **Your Name** - Initial work

## 🙏 Acknowledgments

- Express.js community
- Next.js team
- MongoDB Atlas
- Socket.io contributors

---

⭐ **Star this repository if you found it helpful!**
