const express = require('express');
const router = express.Router();
const passport = require('passport');

const usersController = require('../controllers/users_controller');

// Route for getting current user's profile (for frontend)
router.get('/profile', passport.checkAuthentication, usersController.profile);
router.get('/profile/:id', passport.checkAuthentication, usersController.profile);
router.post('/update/:id', passport.checkAuthentication, usersController.update);

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
router.get('/auth/google/callback', passport.authenticate('google', {failureRedirect: '/users/sign-in'}), usersController.createSession);



module.exports = router;