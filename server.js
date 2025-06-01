require('dotenv').config();
const express = require('express');
const session = require('express-session');
const multer = require('multer');
const { google } = require('googleapis');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ======================= CACHE SYSTEM =======================
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes TTL
  }

  set(key, value, customTTL = null) {
    const expireTime = Date.now() + (customTTL || this.ttl);
    this.cache.set(key, {
      value,
      expireTime
    });
    console.log(`💾 Cache SET: ${key} (TTL: ${(customTTL || this.ttl) / 1000}s)`);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      console.log(`❌ Cache MISS: ${key}`);
      return null;
    }

    if (Date.now() > item.expireTime) {
      this.cache.delete(key);
      console.log(`⏰ Cache EXPIRED: ${key}`);
      return null;
    }

    console.log(`✅ Cache HIT: ${key}`);
    return item.value;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clear() {
    this.cache.clear();
    console.log('🧹 Cache CLEARED');
  }

  // Clear expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireTime) {
        this.cache.delete(key);
        console.log(`🧹 Cache CLEANUP: ${key}`);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.keys())
    };
  }
}

// Initialize cache
const cache = new SimpleCache();

// Cleanup expired cache every 10 minutes
setInterval(() => {
  cache.cleanup();
}, 10 * 60 * 1000);

// ======================= MIDDLEWARE =======================

// Cấu hình middleware
app.use(cors());

// Cache static files for 1 hour
app.use(express.static('public', {
  maxAge: 3600000, // 1 hour
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Cấu hình Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI || (process.env.NODE_ENV === 'production' 
    ? 'https://windfile.onrender.com/auth/callback' 
    : 'http://localhost:3000/auth/callback')
);

// Middleware kiểm tra login
function ensureAuthenticated(req, res, next) {
  if (req.session.tokens) return next();
  res.redirect('/login');
}

// Khởi tạo Multer để xử lý upload file tối đa 1GB
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 1 * 1024 * 1024 * 1024 } // 1GB
});

const DATA_PATH = path.join(__dirname, 'data/files.json');
if (!fs.existsSync('data')) fs.mkdirSync('data');
if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, '[]');

// ======================= ROUTES =======================

// API cache stats (for debugging)
app.get('/api/cache/stats', (req, res) => {
  res.json({
    success: true,
    stats: cache.getStats(),
    timestamp: new Date().toISOString()
  });
});

// API clear cache
app.post('/api/cache/clear', (req, res) => {
  cache.clear();
  res.json({
    success: true,
    message: 'Cache cleared successfully'
  });
});

// API kiểm tra trạng thái đăng nhập
app.get('/api/auth/status', async (req, res) => {
  try {
    if (!req.session.tokens) {
      return res.json({ isAuthenticated: false });
    }

    // Try to get user info from cache first
    const cacheKey = `user_info_${JSON.stringify(req.session.tokens).substring(0, 20)}`;
    let userInfo = cache.get(cacheKey);

    if (!userInfo) {
      // Lấy thông tin user từ Google
      oauth2Client.setCredentials(req.session.tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const response = await oauth2.userinfo.get();
      userInfo = response.data;
      
      // Cache for 1 hour
      cache.set(cacheKey, userInfo, 60 * 60 * 1000);
    }

    res.json({
      isAuthenticated: true,
      user: {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture
      }
    });
  } catch (error) {
    console.error('Error getting user info:', error);
    res.json({ isAuthenticated: false });
  }
});

// API đăng xuất
app.post('/api/auth/logout', (req, res) => {
  // Clear user cache
  const cacheKey = `user_info_${JSON.stringify(req.session.tokens || {}).substring(0, 20)}`;
  cache.delete(cacheKey);
  
  // Clear files cache for this user
  const filesCacheKey = `files_${req.session.tokens?.access_token?.substring(0, 20) || 'unknown'}`;
  cache.delete(filesCacheKey);

  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, error: 'Không thể đăng xuất' });
    }
    res.json({ success: true });
  });
});

// API lấy danh sách file trong folder
app.get('/api/files', ensureAuthenticated, async (req, res) => {
  try {
    console.log('🔍 Getting files list...');
    console.log('📁 FOLDER_ID:', process.env.FOLDER_ID);
    
    // Create cache key based on user token and folder
    const userToken = req.session.tokens?.access_token?.substring(0, 20) || 'unknown';
    const cacheKey = `files_${userToken}_${process.env.FOLDER_ID}`;
    
    // Try to get from cache first
    let files = cache.get(cacheKey);
    
    if (!files) {
      console.log('🌐 Fetching from Google Drive API...');
      
      oauth2Client.setCredentials(req.session.tokens);
      const drive = google.drive({ version: 'v3', auth: oauth2Client });

      const query = `'${process.env.FOLDER_ID}' in parents and trashed=false`;
      console.log('🔎 Query:', query);

      const response = await drive.files.list({
        q: query,
        fields: 'files(id,name,size,mimeType,createdTime,webViewLink,webContentLink)',
        orderBy: 'createdTime desc',
        pageSize: 50
      });

      console.log('📊 Raw response from Google Drive:', JSON.stringify(response.data, null, 2));
      console.log('📈 Files found:', response.data.files?.length || 0);

      files = response.data.files.map(file => ({
        id: file.id,
        name: file.name,
        size: parseInt(file.size) || 0,
        mimeType: file.mimeType,
        createdTime: file.createdTime,
        webViewLink: file.webViewLink,
        downloadLink: `https://drive.google.com/uc?id=${file.id}&export=download`
      }));

      // Cache for 2 minutes (shorter for files as they change more frequently)
      cache.set(cacheKey, files, 2 * 60 * 1000);
    }

    console.log('✅ Processed files:', files);
    
    // Add cache info to response
    res.set('X-Cache-Status', files === cache.get(cacheKey) ? 'HIT' : 'MISS');
    res.json({ 
      success: true, 
      files,
      cached: true,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error listing files:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ success: false, error: 'Không thể lấy danh sách file: ' + error.message });
  }
});

// API xóa file
app.delete('/api/files/:fileId', ensureAuthenticated, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    await drive.files.delete({
      fileId: fileId
    });

    // Clear files cache after deletion
    const userToken = req.session.tokens?.access_token?.substring(0, 20) || 'unknown';
    const cacheKey = `files_${userToken}_${process.env.FOLDER_ID}`;
    cache.delete(cacheKey);
    console.log('🗑️ Files cache cleared after deletion');

    res.json({ success: true, message: 'File đã được xóa thành công' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ success: false, error: 'Không thể xóa file' });
  }
});

// API đổi tên file
app.put('/api/files/:fileId', ensureAuthenticated, async (req, res) => {
  try {
    const { fileId } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, error: 'Tên file không được để trống' });
    }

    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.update({
      fileId: fileId,
      resource: {
        name: name.trim()
      },
      fields: 'id,name'
    });

    // Clear files cache after rename
    const userToken = req.session.tokens?.access_token?.substring(0, 20) || 'unknown';
    const cacheKey = `files_${userToken}_${process.env.FOLDER_ID}`;
    cache.delete(cacheKey);
    console.log('🗑️ Files cache cleared after rename');

    res.json({ 
      success: true, 
      message: 'Đổi tên file thành công',
      file: {
        id: response.data.id,
        name: response.data.name
      }
    });
  } catch (error) {
    console.error('Error renaming file:', error);
    res.status(500).json({ success: false, error: 'Không thể đổi tên file' });
  }
});

// Google OAuth2 login
app.get('/login', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  });
  res.redirect(url);
});

// Google OAuth2 callback
app.get('/auth/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const { tokens } = await oauth2Client.getToken(code);
    req.session.tokens = tokens;
    
    // Lưu thông tin user vào session
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    req.session.user = {
      email: userInfo.data.email,
      name: userInfo.data.name,
      picture: userInfo.data.picture
    };
    
    // Cache user info
    const cacheKey = `user_info_${JSON.stringify(tokens).substring(0, 20)}`;
    cache.set(cacheKey, userInfo.data, 60 * 60 * 1000); // 1 hour
    
    res.redirect('/');
  } catch (error) {
    console.error('Auth callback error:', error);
    res.redirect('/?error=auth_failed');
  }
});

// API upload file lên Google Drive
app.post('/upload', ensureAuthenticated, upload.single('file'), async (req, res) => {
  try {
    console.log('📤 Starting file upload...');
    console.log('📁 Target FOLDER_ID:', process.env.FOLDER_ID);
    console.log('📋 File info:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    const filePath = req.file.path;
    const fileMetadata = {
      name: req.file.originalname,
      parents: [process.env.FOLDER_ID]
    };
    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(filePath)
    };

    oauth2Client.setCredentials(req.session.tokens);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    console.log('🚀 Uploading to Google Drive...');
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,parents'
    });

    console.log('✅ File uploaded:', {
      id: file.data.id,
      name: file.data.name,
      parents: file.data.parents
    });

    // Set quyền công khai cho file
    console.log('🔓 Setting public permissions...');
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    const publicUrl = `https://drive.google.com/uc?id=${file.data.id}&export=download`;
    console.log('🔗 Public URL created:', publicUrl);

    // Clear files cache after upload
    const userToken = req.session.tokens?.access_token?.substring(0, 20) || 'unknown';
    const cacheKey = `files_${userToken}_${process.env.FOLDER_ID}`;
    cache.delete(cacheKey);
    console.log('🗑️ Files cache cleared after upload');

    fs.unlinkSync(filePath); // Xoá file local sau khi up
    res.json({ success: true, url: publicUrl });
  } catch (err) {
    console.error('❌ Upload error:', err);
    console.error('Error details:', err.message);
    res.status(500).json({ success: false, error: 'Lỗi upload file: ' + err.message });
  }
});

app.get('/my-files', ensureAuthenticated, (req, res) => {
  const meta = JSON.parse(fs.readFileSync(DATA_PATH));
  const userFiles = meta.filter(f => f.user_id === req.session.user_id);
  res.json(userFiles);
});

app.delete('/file/:id', ensureAuthenticated, async (req, res) => {
  const fileId = req.params.id;
  oauth2Client.setCredentials(req.session.tokens);
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    await drive.files.delete({ fileId });
    const meta = JSON.parse(fs.readFileSync(DATA_PATH));
    const updated = meta.filter(f => !(f.file_id === fileId && f.user_id === req.session.user_id));
    fs.writeFileSync(DATA_PATH, JSON.stringify(updated, null, 2));
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false });
  }
});

// ======================= START =======================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`💾 Cache system initialized`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔄 Redirect URI: ${process.env.REDIRECT_URI || (process.env.NODE_ENV === 'production' 
    ? 'https://windfile.onrender.com/auth/callback' 
    : 'http://localhost:3000/auth/callback')}`);
  console.log(`📁 Folder ID: ${process.env.FOLDER_ID ? 'Set' : 'Not set'}`);
});
