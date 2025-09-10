const Post = require('../models/post');
const User = require('../models/user');

module.exports.home = async function(req, res){
    try{
        // CHANGE :: populate the likes of each post and comment
        let posts = await Post.find({})
        .sort('-createdAt')
        .populate('user')
        .populate({
            path: 'comments',
            populate: {
                path: 'user'
            }
        })
        .populate({
            path: 'comments',
            populate: {
                path: 'likes'
            }
        }).populate('likes');

        let users = await User.find({});

        return res.status(200).json({
            success: true,
            message: 'Posts fetched successfully',
            data: {
                posts: posts,
                users: users
            }
        });
    }catch(err){
        console.log('Error in fetching posts:', err);
        return res.status(500).json({
            success: false,
            message: 'Error fetching posts',
            error: err
        });
    }
}
