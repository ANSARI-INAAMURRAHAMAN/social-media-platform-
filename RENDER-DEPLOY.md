# Instagram Clone - Render Deployment Guide

## 🚀 Deploy to Render.com

Render is perfect for your Instagram clone! Here's the complete deployment guide.

---

## 📋 Prerequisites

1. **GitHub Repository**: Push your code to GitHub
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **MongoDB Database**: Your MongoDB Atlas connection is ready

---

## 🔧 Step 1: Deploy Backend (Web Service)

### **Create Web Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub repository
4. Use these settings:

```
Name: instagram-clone-backend
Environment: Node
Region: Oregon (US West)
Branch: main
Root Directory: (leave empty - backend is in root)
Build Command: npm install
Start Command: npm start
```

### **Environment Variables** (Add in Render dashboard):
```
PORT=10000
MONGO_URI=your_mongodb_connection_string_here
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GMAIL_USER=your_gmail_address_here
GMAIL_PASS=your_gmail_app_password_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**⚠️ Important**: After deployment, update these:
```
CALLBACK_URL=https://your-backend-url.onrender.com/users/auth/google/callback
FRONTEND_URL=https://your-frontend-url.onrender.com
```

---

## 🌐 Step 2: Deploy Frontend (Static Site)

### **Create Static Site**
1. In Render Dashboard, click **"New"** → **"Static Site"**
2. Connect the same GitHub repository
3. Use these settings:

```
Name: instagram-clone-frontend
Environment: Node
Branch: main
Root Directory: frontend
Build Command: npm install && npm run build
Publish Directory: frontend/out
```

### **Environment Variables**:
```
NEXT_PUBLIC_API_URL=https://your-backend-url.onrender.com
```

**Note**: Replace `your-backend-url` with the actual URL from Step 1

---

## ⚙️ Step 3: Configure Next.js for Static Export

Add this to your `frontend/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  }
}

export default nextConfig
```

---

## 🔄 Step 4: Update Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client
4. Add authorized redirect URI:
   ```
   https://your-backend-url.onrender.com/users/auth/google/callback
   ```

---

## ✅ Deployment Checklist

### **Before Deployment:**
- [ ] Code pushed to GitHub
- [ ] Package.json scripts updated
- [ ] Environment variables documented
- [ ] CORS configuration updated

### **Backend Deployment:**
- [ ] Web service created on Render
- [ ] Environment variables added
- [ ] Build successful
- [ ] Service health check passing

### **Frontend Deployment:**
- [ ] Static site created on Render
- [ ] Build command configured
- [ ] API URL environment variable set
- [ ] Deployment successful

### **Post-Deployment:**
- [ ] Update CALLBACK_URL and FRONTEND_URL
- [ ] Test user registration/login
- [ ] Test file uploads
- [ ] Test AI features
- [ ] Test real-time chat
- [ ] Test on mobile devices

---

## 💰 Render Pricing

**Free Tier Limits:**
- Web Services: 750 hours/month
- Static Sites: Unlimited
- Bandwidth: 100GB/month
- Build time: 90 minutes/month

**Paid Plans:**
- Starter: $7/month (unlimited hours)
- Standard: $25/month (more resources)

---

## 🚨 Common Issues & Solutions

### **Build Failures**
- Check Node.js version compatibility
- Verify package.json scripts
- Review build logs for errors

### **CORS Errors**
- Update FRONTEND_URL in backend environment
- Check allowed origins in CORS configuration

### **File Upload Issues**
- Render has ephemeral filesystem
- Consider using Cloudinary or AWS S3 for file storage

### **Socket.io Connection Issues**
- Verify WebSocket support is enabled
- Check firewall and port configurations

### **Database Connection**
- Ensure MongoDB Atlas allows connections from 0.0.0.0/0
- Verify connection string format

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Render Community**: https://community.render.com
- **GitHub Issues**: Report issues in your repository

---

## 🎉 Your Instagram Clone is Live!

After successful deployment:
- **Frontend**: `https://your-frontend.onrender.com`
- **Backend API**: `https://your-backend.onrender.com`

**Features Available:**
- ✅ User authentication & profiles
- ✅ Photo/video posts with likes & comments
- ✅ Stories with auto-expiry
- ✅ Real-time chat
- ✅ AI-powered content generation
- ✅ Mobile-responsive design

---

**🚀 Ready to Deploy?**

1. Push code to GitHub
2. Create Render services
3. Configure environment variables
4. Deploy and test!

Your Instagram clone will be live in ~15 minutes! 🌟