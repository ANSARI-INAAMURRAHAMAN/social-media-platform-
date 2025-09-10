const express = require('express');
const router = express.Router();
const passport = require('passport');

const usersController = require('../controllers/users_controller');

// Route for getting current user's profile (for frontend)
router.get('/profile', passport.checkAuthentication, usersController.profile);
router.get('/profile/:id', passport.checkAuthentication, usersController.profile);
router.post('/update/:id', passport.checkAuthentication, usersController.update);

// API endpoint to check if user is authenticated
router.get('/auth/status', (req, res) => {
    if (req.isAuthenticated()) {
        return res.status(200).json({
            success: true,
            authenticated: true,
            user: {
                id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                avatar: req.user.avatar
            }
        });
    } else {
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
        
        // Log the user in
        req.logIn(user, (err) => {
            if (err) {
                console.log('Login error after Google OAuth:', err);
                return res.redirect('http://localhost:3000/auth/login?error=login_failed');
            }
            
            // Successful authentication - redirect to Next.js frontend with user data
            console.log('Google OAuth successful for user:', user.email);
            const userData = encodeURIComponent(JSON.stringify({
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar
            }));
            return res.redirect(`http://localhost:3000/feed?auth=success&user=${userData}`);
        });
    })(req, res, next);
});



module.exports = router;