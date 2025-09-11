# 📱 Stories Feature - Video Storage Implementation

## 🎯 **Storage Architecture Overview**

### **Directory Structure:**
```
uploads/
├── stories/
│   ├── images/          # Story images (.jpg, .png, .gif)
│   └── videos/          # Story videos (.mp4, .mov, .avi)
├── posts/
│   └── images/          # Regular post images
└── users/
    └── avatars/         # User profile pictures
```

### **File Organization:**
- **Stories Images**: `uploads/stories/images/`
- **Stories Videos**: `uploads/stories/videos/`
- **Automatic Cleanup**: Files deleted after 24 hours
- **File Size Limits**: 50MB max for videos, 10MB for images

---

## 🎬 **Video Storage Details**

### **Supported Video Formats:**
- **MP4** (recommended) - Best compression and compatibility
- **MOV** - Apple devices
- **AVI** - Windows compatibility
- **WebM** - Web optimized

### **Video Specifications:**
```javascript
// Recommended video specs for optimal performance:
{
  maxDuration: "60 seconds",     // Instagram-like limit
  maxFileSize: "50MB",           // Reasonable for mobile upload
  resolution: "1080x1920",       // Portrait 9:16 ratio
  frameRate: "30fps",            // Smooth playback
  codec: "H.264",                // Best compatibility
  bitrate: "5-8 Mbps"           // Good quality vs size
}
```

### **File Naming Convention:**
```
Format: storyMedia-{timestamp}-{random}.{extension}
Example: storyMedia-1694467200000-123456789.mp4
```

---

## 💾 **Storage Management**

### **Automatic Cleanup System:**
```javascript
// Stories expire after 24 hours automatically
expiresAt: Date.now() + (24 * 60 * 60 * 1000)

// Cleanup runs every hour via cron job
cron.schedule('0 * * * *', cleanupExpiredStories)
```

### **Storage Optimization:**
1. **Automatic Deletion**: Expired stories cleaned up hourly
2. **File Compression**: Client-side video compression recommended
3. **Thumbnail Generation**: Auto-generate video thumbnails (future feature)
4. **Progressive Upload**: Large files uploaded in chunks (future feature)

---

## 🚀 **API Endpoints**

### **Create Story with Video:**
```javascript
POST /stories/create
Content-Type: multipart/form-data

Body:
- storyMedia: File (video/image)
- text: String (optional caption)

Response:
{
  "success": true,
  "message": "Story created successfully!",
  "data": {
    "story": {
      "_id": "story_id",
      "mediaType": "video",
      "mediaUrl": "/uploads/stories/videos/filename.mp4",
      "text": "Optional caption",
      "expiresAt": "2024-09-12T10:30:00.000Z"
    }
  }
}
```

### **Get Stories Feed:**
```javascript
GET /stories/
Authorization: Bearer {jwt_token}

Response:
{
  "success": true,
  "data": {
    "storiesByUser": [
      {
        "user": { "name": "John Doe", "avatar": "..." },
        "stories": [
          {
            "mediaType": "video",
            "mediaUrl": "/uploads/stories/videos/story.mp4",
            "views": 15,
            "createdAt": "2024-09-11T10:30:00.000Z"
          }
        ]
      }
    ]
  }
}
```

---

## 🔧 **Implementation Guide**

### **Step 1: Install Dependencies** (if needed)
```bash
npm install node-cron  # For cleanup scheduling
npm install ffmpeg     # For video processing (optional)
```

### **Step 2: Initialize Story Service**
```javascript
// Add to index.js or app.js
const StoryService = require('./services/story_service');

// Initialize after database connection
StoryService.initialize();
```

### **Step 3: Frontend Video Upload**
```javascript
// Example React/Next.js component
const uploadStory = async (file, text) => {
  const formData = new FormData();
  formData.append('storyMedia', file);
  formData.append('text', text);
  
  const response = await fetch('/stories/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};
```

---

## 📊 **Monitoring & Analytics**

### **Storage Monitoring:**
```javascript
// Get storage statistics
GET /stories/analytics/storage

Response:
{
  "totalSizeMB": "250.5",
  "videoSizeMB": "200.3", 
  "imageSizeMB": "50.2",
  "activeStories": 45
}
```

### **Story Analytics:**
```javascript
// Individual story performance
GET /stories/{storyId}/analytics

Response:
{
  "storyId": "...",
  "totalViews": 127,
  "views": [
    { "user": "...", "viewedAt": "..." }
  ]
}
```

---

## 🛡️ **Security & Validation**

### **File Validation:**
```javascript
// Multer file filter
const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('video/') || file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video and image files allowed!'), false);
  }
};

// Size limits
limits: {
  fileSize: 50 * 1024 * 1024 // 50MB
}
```

### **User Authentication:**
- JWT token required for all story operations
- Users can only delete their own stories
- Story views tracked per user
- Privacy controls (followers only)

---

## 🚀 **Future Enhancements**

### **Video Processing Pipeline:**
```javascript
// Planned features:
1. Automatic thumbnail generation using FFmpeg
2. Video compression optimization
3. Multiple quality versions (360p, 720p, 1080p)
4. Video format conversion for compatibility
5. Progressive video loading
```

### **Advanced Features:**
```javascript
// Roadmap:
1. Story highlights (permanent stories)
2. Story templates and filters
3. Music integration
4. AR filters and effects
5. Story collaboration
6. Story insights and analytics
7. Story advertising
```

---

## 🎯 **Performance Considerations**

### **Video Optimization Tips:**
1. **Client-side compression** before upload
2. **Progressive uploads** for large files
3. **CDN integration** for global delivery
4. **Lazy loading** for story feeds
5. **Video preloading** for smooth playback

### **Server Optimization:**
```javascript
// Recommended server setup:
- SSD storage for faster I/O
- CDN for video delivery (CloudFront, Cloudinary)
- Load balancing for upload endpoints
- Separate video processing servers
- Redis caching for story metadata
```

---

## 📱 **Mobile Considerations**

### **Upload Optimization:**
- Compress videos on mobile before upload
- Show upload progress indicators
- Handle network interruptions gracefully
- Optimize for different screen sizes
- Battery usage optimization

### **Playback Optimization:**
- Auto-play with sound control
- Smooth transitions between stories
- Preload next story for seamless experience
- Adaptive quality based on network speed

---

This comprehensive video storage solution provides a solid foundation for your Stories feature while maintaining scalability and performance. The automatic cleanup ensures storage doesn't grow indefinitely, and the modular design allows for easy future enhancements!
