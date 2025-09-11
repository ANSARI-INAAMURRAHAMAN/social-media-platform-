const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');

const usersController = require('../controllers/users_controller');
const { authenticateJWT } = require('../config/middleware');

// Route for getting current user's profile (for frontend)
router.get('/profile', authenticateJWT, usersController.profile);
router.get('/profile/:id', authenticateJWT, usersController.profile);
router.post('/update/:id', authenticateJWT, usersController.update);

// Add a new route for updating the current user's profile without ID parameter
const profileController = require('../controllers/profile_controller');
router.post('/update', authenticateJWT, profileController.updateUser);

// API endpoint to check if user is authenticated with JWT
router.get('/auth/status', authenticateJWT, (req, res) => {
    return res.status(200).json({
        success: true,
        authenticated: true,
        user: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            username: req.user.username,
            avatar: req.user.avatar
        }
    });
});

// API endpoint to verify token without requiring authentication
router.get('/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(200).json({
            success: true,
            authenticated: false,
            user: null
        });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('../models/user');
        
        User.findById(decoded.id, function(err, user) {
            if (err || !user) {
                return res.status(200).json({
                    success: true,
                    authenticated: false,
                    user: null
                });
            }
            
            return res.status(200).json({
                success: true,
                authenticated: true,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    avatar: user.avatar
                }
            });
        });
    } catch (error) {
        return res.status(200).json({
            success: true,
            authenticated: false,
            user: null
        });
    }
});

router.get('/sign-up', usersController.signUp);
router.get('/sign-in', usersController.signIn);


router.post('/create', usersController.create);

// Custom authentication middleware for API
const authenticateAPI = (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Authentication error',
                error: err
            });
        }
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        req.logIn(user, (err) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    message: 'Login error',
                    error: err
                });
            }
            return next();
        });
    })(req, res, next);
};

// use passport as a middleware to authenticate
router.post('/create-session', authenticateAPI, usersController.createSession);

router.get('/sign-out', usersController.destroySession);
router.post('/destroy-session', usersController.destroySession);


router.get('/auth/google', passport.authenticate('google', {scope: ['profile', 'email']}));

// Google OAuth callback - handle both success and failure for Next.js frontend
router.get('/auth/google/callback', (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
        if (err) {
            console.log('Google OAuth error:', err);
            return res.redirect('http://localhost:3000/auth/login?error=oauth_error');
        }
        
        if (!user) {
            console.log('Google OAuth failed - no user');
            return res.redirect('http://localhost:3000/auth/login?error=oauth_failed');
        }
        
        // Create JWT token for the user
        const token = jwt.sign(
            { 
                _id: user._id,
                email: user.email 
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        // Successful authentication - redirect to Next.js frontend with JWT token
        console.log('Google OAuth successful for user:', user.email);
        const userData = encodeURIComponent(JSON.stringify({
            id: user._id,
            name: user.name,
            email: user.email,
            username: user.username,
            avatar: user.avatar
        }));
        return res.redirect(`http://localhost:3000/feed?auth=success&token=${token}&user=${userData}`);
    })(req, res, next);
});



module.exports = router;