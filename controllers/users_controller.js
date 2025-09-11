const User = require('../models/user');
const Friendship = require('../models/friendship');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

// let's keep it same as before
module.exports.profile = async function(req, res){
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'User not authenticated'
        });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get follow counts
        const followersCount = await Friendship.getFollowersCount(user._id);
        const followingCount = await Friendship.getFollowingCount(user._id);

        return res.status(200).json({
            success: true,
            message: 'User profile fetched successfully',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    avatar: user.avatar,
                    followersCount: followersCount,
                    followingCount: followingCount
                }
            }
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching user profile',
            error: err
        });
    }
}


module.exports.update = async function(req, res){
   

    if(req.user.id == req.params.id){

        try{

            let user = await User.findById(req.params.id);
            User.uploadedAvatar(req, res, function(err){
                if (err) {console.log('*****Multer Error: ', err)}
                
                user.name = req.body.name;
                user.email = req.body.email;

                if (req.file){

                    if (user.avatar){
                        fs.unlinkSync(path.join(__dirname, '..', user.avatar));
                    }


                    // this is saving the path of the uploaded file into the avatar field in the user
                    user.avatar = User.avatarPath + '/' + req.file.filename;
                }
                user.save();
                
                return res.status(200).json({
                    success: true,
                    message: 'Profile updated successfully',
                    data: {
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            avatar: user.avatar
                        }
                    }
                });
            });

        }catch(err){
            console.log('Error updating profile:', err);
            return res.status(500).json({
                success: false,
                message: 'Error updating profile',
                error: err
            });
        }


    }else{
        return res.status(401).json({
            success: false,
            message: 'Unauthorized to update this profile'
        });
    }
}


// render the sign up page
module.exports.signUp = function(req, res){
    if (req.isAuthenticated()){
        return res.status(200).json({
            success: true,
            message: 'User already authenticated',
            data: { user: req.user }
        });
    }

    return res.status(200).json({
        success: true,
        message: 'Sign up page accessed'
    });
}


// render the sign in page
module.exports.signIn = function(req, res){
    if (req.isAuthenticated()){
        return res.status(200).json({
            success: true,
            message: 'User already authenticated',
            data: { user: req.user }
        });
    }
    
    return res.status(200).json({
        success: true,
        message: 'Sign in page accessed'
    });
}

// get the sign up data
module.exports.create = function(req, res){
    if (req.body.password != req.body.confirm_password){
        return res.status(400).json({
            success: false,
            message: 'Passwords do not match'
        });
    }

    User.findOne({email: req.body.email}, function(err, user){
        if(err){
            return res.status(500).json({
                success: false,
                message: 'Database error',
                error: err
            });
        }

        if (!user){
            // Generate a unique username from name or email
            let username = req.body.name.toLowerCase().replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
            
            const userData = {
                ...req.body,
                username: username
            };
            
            User.create(userData, function(err, user){
                if(err){
                    return res.status(500).json({
                        success: false,
                        message: 'Error creating user',
                        error: err
                    });
                }

                return res.status(201).json({
                    success: true,
                    message: 'User created successfully! Please login to continue.',
                    data: {
                        user: {
                            _id: user._id,
                            name: user.name,
                            email: user.email,
                            username: user.username
                        }
                    }
                });
            })
        }else{
            return res.status(400).json({
                success: false,
                message: 'User already exists with this email'
            });
        }

    });
}


// sign in and create a JWT token for the user
module.exports.createSession = function(req, res){
    const token = jwt.sign(
        { 
            id: req.user._id,
            email: req.user.email 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
    );

    return res.status(200).json({
        success: true,
        message: 'Logged in successfully',
        data: {
            token: token,
            user: {
                _id: req.user._id,
                name: req.user.name,
                email: req.user.email,
                username: req.user.username,
                avatar: req.user.avatar
            }
        }
    });
}

module.exports.destroySession = function(req, res){
    req.logout(function(err) {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Error logging out',
                error: err
            });
        }
        
        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    });
}