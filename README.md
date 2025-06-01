# 📤 Drive Uploader

Google Drive file uploader với đăng nhập Google OAuth2, hệ thống cache thông minh và giao diện Bootstrap đẹp mắt.

## ✨ Tính năng

### 🔐 **Authentication & Security**
- Đăng nhập bằng Google OAuth2
- Session management với TTL
- Logout an toàn với cache cleanup

### 📤 **Upload Features**
- Upload file lên Google Drive (tối đa 1GB)
- Real-time upload progress với tốc độ và thời gian còn lại
- Drag & drop support
- Auto-resize và responsive UI

### 📁 **File Management**
- Xem danh sách file trong Google Drive folder
- Download, copy link, rename, delete file
- Responsive table với mobile-friendly actions
- Toast notifications cho user feedback

### ⚡ **Performance & Cache**
- **Backend cache**: Google Drive API responses (2-5 phút TTL)
- **Frontend cache**: Auth status, files list (1-5 phút TTL)
- **Static file caching**: CSS/JS cached 1 giờ
- **Smart cache invalidation** khi có thay đổi

### 🎨 **Modern UI/UX**
- **Bootstrap 5** framework
- **Bootstrap Icons** cho icons đẹp
- **Custom CSS** cho branding riêng
- **Responsive design** cho mobile/tablet
- **Modern animations** và transitions

## 🏗️ Cấu trúc Project

```
drive-uploader/
├── server.js              # Backend server với cache system
├── package.json           # Dependencies và scripts
├── env.example            # Environment variables example
├── public/
│   ├── index.html         # HTML với Bootstrap integration
│   ├── style.css          # Custom CSS styles
│   └── upload.js          # Frontend JavaScript với cache
├── uploads/               # Temporary upload folder
└── data/
    └── files.json         # File metadata storage
```

## 🚀 Setup & Installation

### **1. Clone Repository**
```bash
git clone <repository-url>
cd drive-uploader
npm install
```

### **2. Google Cloud Console Setup**
1. Tạo project tại [Google Cloud Console](https://console.cloud.google.com)
2. Enable **Google Drive API** và **Google+ API**
3. Tạo **OAuth 2.0 Client ID**:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/auth/callback` (development)
     - `https://your-domain.com/auth/callback` (production)

### **3. Environment Variables**
Tạo file `.env` từ `env.example`:

```bash
# Google OAuth2 Configuration
CLIENT_ID=your_google_oauth2_client_id
CLIENT_SECRET=your_google_oauth2_client_secret
REDIRECT_URI=http://localhost:3000/auth/callback

# Session Configuration  
SESSION_SECRET=your_random_session_secret_here

# Google Drive Configuration
FOLDER_ID=your_google_drive_folder_id

# Server Configuration
PORT=3000
NODE_ENV=development
```

### **4. Google Drive Folder Setup**
1. Tạo folder trên Google Drive
2. Copy **Folder ID** từ URL:
   ```
   https://drive.google.com/drive/folders/1ABC123XYZ_FOLDER_ID_HERE
   ```
3. Paste vào `.env` file

### **5. Run Application**
```bash
# Development
npm run dev

# Production
npm start
```

## 🌐 Deployment (Render)

### **1. Environment Variables trên Render:**
```
CLIENT_ID = your_google_client_id
CLIENT_SECRET = your_google_client_secret
REDIRECT_URI = https://your-app.onrender.com/auth/callback
SESSION_SECRET = random_string_32_chars
FOLDER_ID = your_google_drive_folder_id
NODE_ENV = production
```

### **2. Update Google OAuth Settings:**
Thêm production URL vào **Authorized redirect URIs**:
```
https://your-app.onrender.com/auth/callback
```

## 🎯 API Endpoints

### **Authentication**
- `GET /login` - Redirect to Google OAuth
- `GET /auth/callback` - OAuth callback handler
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/logout` - Logout user

### **File Operations**
- `POST /upload` - Upload file to Google Drive
- `GET /api/files` - Get files list (cached)
- `DELETE /api/files/:id` - Delete file
- `PUT /api/files/:id` - Rename file

### **Cache Management**
- `GET /api/cache/stats` - Get cache statistics
- `POST /api/cache/clear` - Clear all cache

## 💾 Cache System

### **Backend Cache (Server)**
```javascript
// User info: 1 giờ TTL
cache.set('user_info_xxx', userInfo, 60 * 60 * 1000);

// Files list: 2 phút TTL  
cache.set('files_xxx', filesList, 2 * 60 * 1000);

// Auto cleanup: 10 phút
setInterval(() => cache.cleanup(), 10 * 60 * 1000);
```

### **Frontend Cache (Browser)**
```javascript
// Auth status: 5 phút TTL
frontendCache.set('auth_status', data, 5 * 60 * 1000);

// Files list: 1 phút TTL
frontendCache.set('files_list_xxx', files, 60 * 1000);

// Auto cleanup: 30 giây
setInterval(() => frontendCache.cleanup(), 30 * 1000);
```

### **Cache Debugging**
- **Cache indicator**: Góc trái màn hình hiển thị số cache items
- **Keyboard shortcut**: `Ctrl+Shift+C` để xem cache stats
- **Console logging**: Track cache HIT/MISS/EXPIRED
- **Browser DevTools**: Network tab shows cache headers

## 🎨 CSS Architecture

### **Bootstrap 5 Integration**
```html
<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Bootstrap Icons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css">

<!-- Custom CSS -->
<link rel="stylesheet" href="style.css">
```

### **Custom CSS Structure**
- **Main container styling**: Background gradients, centering
- **Typography**: Custom fonts, colors, sizes
- **Auth section**: Login button, user profile, logout
- **Tab navigation**: Custom tab system
- **Upload section**: File input, progress bars, results
- **File manager**: Tables, action buttons, modals
- **Responsive design**: Mobile-first approach

## 🛠️ Tech Stack

### **Backend**
- **Node.js** + **Express.js**
- **Google APIs** (Drive, OAuth2)
- **Multer** for file uploads
- **Express-session** for session management
- **Custom in-memory cache** system

### **Frontend**
- **Bootstrap 5** CSS framework
- **Bootstrap Icons** icon library
- **Vanilla JavaScript** (no frameworks)
- **Custom CSS** for branding
- **Frontend cache** system

### **Features**
- **OAuth2 authentication**
- **Real-time upload progress**
- **Responsive design**
- **Smart caching**
- **File management**
- **Toast notifications**

## 🔧 Development

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Kill existing process on port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### **Debugging Cache**
```javascript
// Check cache stats
console.log('Frontend Cache:', frontendCache.getStats());

// Clear specific cache
frontendCache.delete('files_list_user@example.com');

// Force refresh (bypass cache)
loadFiles(true);
```

### **Debugging OAuth**
1. Check Google Cloud Console credentials
2. Verify redirect URIs match exactly
3. Check environment variables
4. Monitor server logs for auth errors

## 📱 Mobile Support

- **Responsive design** cho tất cả devices
- **Touch-friendly** buttons và interactions  
- **Mobile-optimized** file manager table
- **Grid layout** cho action buttons trên mobile
- **Responsive modals** và forms

## 🚨 Troubleshooting

### **Port already in use**
```bash
netstat -ano | findstr :3000
taskkill /PID <process_id> /F
```

### **OAuth redirect error**
- Check `REDIRECT_URI` in `.env`
- Verify Google Cloud Console settings
- Ensure URLs match exactly (http vs https)

### **Cache issues**
- Use `Ctrl+Shift+C` to check cache stats
- Clear cache via `/api/cache/clear`
- Check browser Network tab for cache headers

### **Avatar not showing**
- Verify Google OAuth scope includes profile
- Check user permissions for profile picture
- Check browser console for image load errors

## 📄 License

MIT License - feel free to use for personal or commercial projects.

---

**Developed with ❤️ using Bootstrap 5 + Node.js + Google Drive API**
