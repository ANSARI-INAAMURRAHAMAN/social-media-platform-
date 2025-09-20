const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to upload image to Cloudinary
const uploadImage = async (file, folder = 'instagram-clone') => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'image',
            transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });
        return result;
    } catch (error) {
        console.error('Cloudinary image upload error:', error);
        throw error;
    }
};

// Helper function to upload video to Cloudinary
const uploadVideo = async (file, folder = 'instagram-clone/videos') => {
    try {
        const result = await cloudinary.uploader.upload(file.path, {
            folder: folder,
            resource_type: 'video',
            transformation: [
                { quality: 'auto' },
                { fetch_format: 'auto' }
            ]
        });
        return result;
    } catch (error) {
        console.error('Cloudinary video upload error:', error);
        throw error;
    }
};

// Helper function to delete file from Cloudinary
const deleteFile = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return result;
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        throw error;
    }
};

// Extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
    try {
        const parts = url.split('/');
        const filename = parts[parts.length - 1];
        return filename.split('.')[0];
    } catch (error) {
        console.error('Error extracting public ID:', error);
        return null;
    }
};

module.exports = {
    cloudinary,
    uploadImage,
    uploadVideo,
    deleteFile,
    getPublicIdFromUrl
};