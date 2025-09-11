const passport = require('passport');

module.exports.setFlash = function(req, res, next){
    res.locals.flash = {
        'success': req.flash('success'),
        'error': req.flash('error')
    }

    next();
}

// JWT Authentication middleware
module.exports.authenticateJWT = function(req, res, next) {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
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
                message: 'Unauthorized - Invalid or missing token'
            });
        }
        
        req.user = user;
        next();
    })(req, res, next);
}