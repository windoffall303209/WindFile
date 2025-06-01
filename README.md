<<<<<<< HEAD
# 📤 Google Drive Uploader

Ứng dụng web upload file lên Google Drive với giao diện hiện đại và theo dõi tiến trình upload real-time.

## ✨ Tính năng

- 🔐 **Đăng nhập bằng Google OAuth2** - Xác thực an toàn
- 📁 **Drag & Drop upload** - Kéo thả file hoặc click để chọn
- 📊 **Theo dõi tiến trình real-time** - Progress bar, tốc độ upload, thời gian còn lại
- ⏱️ **Hiển thị thời gian upload** - Đếm thời gian upload chi tiết
- 📱 **Giao diện responsive** - Hoạt động tốt trên mọi thiết bị
- 🔗 **Tự động tạo link chia sẻ** - Link download trực tiếp từ Google Drive
- 📈 **Thống kê upload** - Hiển thị tên file, kích thước, loại file
- 🎨 **UI/UX hiện đại** - Giao diện đẹp mắt với hiệu ứng smooth

## ✅ Yêu cầu

- Node.js (phiên bản 14 trở lên)
- Tài khoản Google + đã tạo OAuth Client ID
- Tạo 1 folder công khai trên Google Drive

## ⚙️ Cài đặt

1. **Clone repository:**
```bash
git clone <repository-url>
cd drive-uploader
```

2. **Cài đặt dependencies:**
```bash
npm install
```

3. **Tạo file `.env`:**
```bash
# Google OAuth2 Configuration
CLIENT_ID=your_google_client_id_here
CLIENT_SECRET=your_google_client_secret_here
REDIRECT_URI=http://localhost:3000/auth/callback

# Google Drive Configuration
FOLDER_ID=your_google_drive_folder_id_here

# Session Configuration
SESSION_SECRET=your_random_session_secret_here

# Server Configuration
PORT=3000
```

4. **Chạy ứng dụng:**
```bash
npm start
```

5. **Truy cập:** http://localhost:3000

## 🔧 Cấu hình Google OAuth2

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project có sẵn
3. Bật Google Drive API
4. Tạo OAuth 2.0 credentials
5. Thêm `http://localhost:3000/auth/callback` vào Authorized redirect URIs
6. Copy Client ID và Client Secret vào file `.env`

## 📁 Tạo Google Drive Folder

1. Tạo folder mới trên Google Drive
2. Click chuột phải → "Get link" → "Anyone with the link"
3. Copy Folder ID từ URL (phần sau folders/)
4. Thêm vào file `.env`

## 🚀 Tính năng mới

- **Real-time Progress Tracking**: Theo dõi tiến trình upload với progress bar chi tiết
- **Upload Speed Display**: Hiển thị tốc độ upload (MB/s)
- **Time Estimation**: Tính toán thời gian còn lại
- **Enhanced UI**: Giao diện hiện đại với gradient và shadows
- **File Information**: Hiển thị chi tiết thông tin file trước khi upload
- **Drag & Drop**: Hỗ trợ kéo thả file để upload
=======
# WindFile
>>>>>>> 51947dd96d6ae0ecdd99eea46ebdec4859d8f6d8
