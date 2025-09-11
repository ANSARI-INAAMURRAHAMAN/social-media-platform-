const Story = require('../models/story');
const cron = require('node-cron');

// Service to handle story cleanup and maintenance
class StoryService {
    
    // Initialize the cleanup service
    static initialize() {
        console.log('📱 Story Service initialized');
        
        // Run cleanup every hour
        this.startCleanupScheduler();
        
        // Run initial cleanup
        this.cleanupExpiredStories();
    }
    
    // Start the automated cleanup scheduler
    static startCleanupScheduler() {
        // Run every hour at minute 0
        cron.schedule('0 * * * *', async () => {
            console.log('🧹 Running scheduled story cleanup...');
            await this.cleanupExpiredStories();
        });
        
        console.log('⏰ Story cleanup scheduler started (runs hourly)');
    }
    
    // Clean up expired stories
    static async cleanupExpiredStories() {
        try {
            const cleanedCount = await Story.cleanupExpiredStories();
            if (cleanedCount > 0) {
                console.log(`🗑️ Cleaned up ${cleanedCount} expired stories`);
            }
        } catch (error) {
            console.error('❌ Error during story cleanup:', error);
        }
    }
    
    // Get storage statistics
    static async getStorageStats() {
        try {
            const fs = require('fs');
            const path = require('path');
            
            const storiesPath = path.join(__dirname, '../uploads/stories');
            const imagesPath = path.join(storiesPath, 'images');
            const videosPath = path.join(storiesPath, 'videos');
            
            const getDirectorySize = (dirPath) => {
                if (!fs.existsSync(dirPath)) return 0;
                
                let totalSize = 0;
                const files = fs.readdirSync(dirPath);
                
                files.forEach(file => {
                    const filePath = path.join(dirPath, file);
                    const stats = fs.statSync(filePath);
                    totalSize += stats.size;
                });
                
                return totalSize;
            };
            
            const imageSize = getDirectorySize(imagesPath);
            const videoSize = getDirectorySize(videosPath);
            const totalSize = imageSize + videoSize;
            
            // Get active stories count
            const activeStoriesCount = await Story.countDocuments({
                isActive: true,
                expiresAt: { $gt: new Date() }
            });
            
            return {
                totalSize: totalSize,
                imageSizeMB: (imageSize / (1024 * 1024)).toFixed(2),
                videoSizeMB: (videoSize / (1024 * 1024)).toFixed(2),
                totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
                activeStories: activeStoriesCount
            };
            
        } catch (error) {
            console.error('Error getting storage stats:', error);
            return null;
        }
    }
    
    // Manual cleanup trigger (for admin use)
    static async forceCleanup() {
        console.log('🚀 Force cleanup initiated...');
        return await this.cleanupExpiredStories();
    }
}

module.exports = StoryService;
