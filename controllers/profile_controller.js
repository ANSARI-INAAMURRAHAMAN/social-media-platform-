const User = require('../models/user');

module.exports.updateUser = async function(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }

        // Find the user
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update user fields
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        
        // Update username if provided
        if (req.body.username) {
            user.username = req.body.username;
        }

        // Update password if provided
        if (req.body.password) {
            user.password = req.body.password;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    username: user.username,
                    avatar: user.avatar
                }
            }
        });

    } catch (err) {
        console.log('Error updating profile:', err);
        return res.status(500).json({
            success: false,
            message: 'Error updating profile',
            error: err.message
        });
    }
}
