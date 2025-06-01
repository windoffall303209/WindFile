// ======================= FRONTEND CACHE SYSTEM =======================
class FrontendCache {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 2 * 60 * 1000; // 2 minutes default TTL
  }

  set(key, value, ttl = null) {
    const expireTime = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, {
      value,
      expireTime,
      timestamp: new Date().toISOString()
    });
    console.log(`📦 Frontend Cache SET: ${key} (TTL: ${(ttl || this.defaultTTL) / 1000}s)`);
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) {
      console.log(`❌ Frontend Cache MISS: ${key}`);
      return null;
    }

    if (Date.now() > item.expireTime) {
      this.cache.delete(key);
      console.log(`⏰ Frontend Cache EXPIRED: ${key}`);
      return null;
    }

    console.log(`✅ Frontend Cache HIT: ${key} (age: ${Math.round((Date.now() - new Date(item.timestamp).getTime()) / 1000)}s)`);
    return item.value;
  }

  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️ Frontend Cache DELETE: ${key}`);
    }
    return deleted;
  }

  clear() {
    this.cache.clear();
    console.log('🧹 Frontend Cache CLEARED');
  }

  // Clear all user-specific cache
  clearUserCache(userId) {
    for (const [key] of this.cache.entries()) {
      if (key.includes(userId) || key.includes('user_') || key.includes('files_')) {
        this.delete(key);
      }
    }
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      items: Array.from(this.cache.entries()).map(([key, item]) => ({
        key,
        age: Math.round((Date.now() - new Date(item.timestamp).getTime()) / 1000),
        expiresIn: Math.round((item.expireTime - Date.now()) / 1000)
      }))
    };
  }
}

// Initialize frontend cache
const frontendCache = new FrontendCache();

// Cache indicator elements
const cacheIndicator = document.getElementById('cacheIndicator');
const cacheStatus = document.getElementById('cacheStatus');

// Update cache indicator
function updateCacheIndicator() {
  const stats = frontendCache.getStats();
  if (stats.size > 0) {
    cacheStatus.textContent = `${stats.size} items`;
    cacheIndicator.classList.add('show');
  } else {
    cacheIndicator.classList.remove('show');
  }
}

// Cache indicator click handler
cacheIndicator.addEventListener('click', () => {
  const stats = frontendCache.getStats();
  console.log('📊 Frontend Cache Stats:', stats);
  
  // Show detailed cache info in toast
  const items = stats.items.map(item => 
    `${item.key} (${item.age}s old, expires in ${item.expiresIn}s)`
  ).join('\n');
  
  showToast(`📊 Cache: ${stats.size} items\nClick console for details`, 'info');
});

// Clear expired cache every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of frontendCache.cache.entries()) {
    if (now > item.expireTime) {
      frontendCache.delete(key);
    }
  }
  updateCacheIndicator();
}, 30 * 1000);

// Update cache indicator when cache changes
const originalSet = frontendCache.set.bind(frontendCache);
const originalDelete = frontendCache.delete.bind(frontendCache);
const originalClear = frontendCache.clear.bind(frontendCache);

frontendCache.set = function(key, value, ttl) {
  originalSet(key, value, ttl);
  updateCacheIndicator();
};

frontendCache.delete = function(key) {
  const result = originalDelete(key);
  updateCacheIndicator();
  return result;
};

frontendCache.clear = function() {
  originalClear();
  updateCacheIndicator();
};

// ======================= DOM ELEMENTS =======================
// Các elements DOM - Authentication
const authLoading = document.getElementById('authLoading');
const loginBtn = document.getElementById('loginBtn');
const userProfile = document.getElementById('userProfile');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userEmail = document.getElementById('userEmail');
const logoutBtn = document.getElementById('logoutBtn');
const mainContent = document.getElementById('mainContent');

// Các elements DOM - Upload
const fileInput = document.getElementById('fileInput');
const fileLabel = document.getElementById('fileLabel');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const fileType = document.getElementById('fileType');
const uploadBtn = document.getElementById('uploadBtn');
const progressContainer = document.getElementById('progressContainer');
const progressFill = document.getElementById('progressFill');
const statusText = document.getElementById('statusText');
const timer = document.getElementById('timer');
const uploadSpeed = document.getElementById('uploadSpeed');
const timeRemaining = document.getElementById('timeRemaining');
const uploadedSize = document.getElementById('uploadedSize');
const result = document.getElementById('result');

// Các elements DOM - File Manager
const filesList = document.getElementById('filesList');
const refreshBtn = document.getElementById('refreshBtn');
const renameModal = document.getElementById('renameModal');
const deleteModal = document.getElementById('deleteModal');
const renameInput = document.getElementById('renameInput');
const deleteFileName = document.getElementById('deleteFileName');

let selectedFile = null;
let startTime = null;
let timerInterval = null;
let currentUser = null;
let currentFiles = [];
let currentRenameFileId = null;
let currentDeleteFileId = null;

// ======================= UTILITY FUNCTIONS =======================

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format time
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Truncate text for display
function truncateText(text, maxLength = 30) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Set tooltip for element
function setTooltip(element, fullText) {
  if (fullText && fullText.length > 30) {
    element.setAttribute('data-tooltip', fullText);
    element.classList.add('tooltip');
  } else {
    element.removeAttribute('data-tooltip');
    element.classList.remove('tooltip');
  }
}

// Reset upload form
function resetUploadForm() {
  selectedFile = null;
  fileInput.value = '';
  fileLabel.innerHTML = `
    📁 Chọn file để upload<br>
    <small>Kéo thả file vào đây hoặc click để chọn (Tối đa 1GB)</small>
  `;
  fileLabel.classList.remove('has-file');
  fileInfo.style.display = 'none';
  uploadBtn.disabled = true;
  uploadBtn.textContent = '🚀 Tải lên Google Drive';
  progressContainer.style.display = 'none';
  result.style.display = 'none';
  stopTimer();
  timer.textContent = '00:00';
  
  // Reset file info
  fileName.textContent = '-';
  fileName.removeAttribute('data-tooltip');
  fileName.classList.remove('tooltip');
}

// ======================= AUTH FUNCTIONS =======================

// Kiểm tra trạng thái đăng nhập
async function checkAuthStatus() {
  try {
    // Check cache first
    const cachedAuth = frontendCache.get('auth_status');
    if (cachedAuth) {
      handleAuthResponse(cachedAuth);
      return;
    }

    const response = await fetch('/api/auth/status');
    const data = await response.json();
    
    // Cache auth status for 5 minutes
    frontendCache.set('auth_status', data, 5 * 60 * 1000);
    
    handleAuthResponse(data);
  } catch (error) {
    console.error('Error checking auth status:', error);
    authLoading.style.display = 'none';
    loginBtn.style.display = 'inline-block';
  }
}

// Handle auth response (extracted to reuse for cached data)
function handleAuthResponse(data) {
  authLoading.style.display = 'none';
  
  if (data.isAuthenticated) {
    // Hiển thị thông tin user
    currentUser = data.user;
    
    // Set user name with tooltip for long names
    userName.textContent = data.user.name;
    setTooltip(userName, data.user.name);
    
    // Set user email with tooltip for long emails
    userEmail.textContent = data.user.email;
    setTooltip(userEmail, data.user.email);
    
    userAvatar.src = data.user.picture;
    
    userProfile.style.display = 'flex';
    mainContent.style.display = 'block';
    loginBtn.style.display = 'none';
    
    // Load files for file manager (will use cache if available)
    loadFiles();
  } else {
    // Hiển thị nút đăng nhập
    loginBtn.style.display = 'inline-block';
    userProfile.style.display = 'none';
    mainContent.style.display = 'none';
  }
}

// Đăng xuất
async function logout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST'
    });
    
    if (response.ok) {
      // Clear all frontend cache
      frontendCache.clear();
      
      // Reset UI
      userProfile.style.display = 'none';
      mainContent.style.display = 'none';
      loginBtn.style.display = 'inline-block';
      
      // Reset upload form
      resetUploadForm();
      
      currentUser = null;
      currentFiles = [];
    } else {
      showToast('❌ Không thể đăng xuất. Vui lòng thử lại!', 'error');
    }
  } catch (error) {
    console.error('Logout error:', error);
    showToast('❌ Có lỗi xảy ra khi đăng xuất!', 'error');
  }
}

// ======================= TAB FUNCTIONS =======================

// Switch between tabs
function switchTab(tabName) {
  // Remove active class from all tabs and contents
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
  
  // Add active class to selected tab and content
  document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(`${tabName}Tab`).classList.add('active');
  
  // Load files if switching to manage tab
  if (tabName === 'manage') {
    loadFiles();
  }
}

// ======================= FILE MANAGER FUNCTIONS =======================

// Load files from Google Drive
async function loadFiles(forceRefresh = false) {
  try {
    const cacheKey = `files_list_${currentUser?.email || 'unknown'}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedFiles = frontendCache.get(cacheKey);
      if (cachedFiles) {
        currentFiles = cachedFiles.files;
        renderFilesList(cachedFiles.files);
        
        // Show cache indicator in UI
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
          refreshBtn.innerHTML = '💾 Dữ liệu cache';
          setTimeout(() => {
            refreshBtn.innerHTML = '🔄 Làm mới';
          }, 2000);
        }
        return;
      }
    }
    
    filesList.innerHTML = '<div class="loading"><span class="spinner"></span>Đang tải danh sách file...</div>';
    
    const response = await fetch('/api/files');
    const data = await response.json();
    
    if (data.success) {
      currentFiles = data.files;
      
      // Cache the files list for 1 minute
      frontendCache.set(cacheKey, { files: data.files, timestamp: data.timestamp }, 60 * 1000);
      
      renderFilesList(data.files);
      
      // Show cache status in console
      const cacheStatus = response.headers.get('X-Cache-Status');
      if (cacheStatus) {
        console.log(`🎯 Backend Cache Status: ${cacheStatus}`);
      }
    } else {
      filesList.innerHTML = `<div class="empty-state"><h3>Lỗi</h3><p>${data.error}</p></div>`;
    }
  } catch (error) {
    console.error('Error loading files:', error);
    filesList.innerHTML = '<div class="empty-state"><h3>Lỗi</h3><p>Không thể tải danh sách file</p></div>';
  }
}

// Render files list
function renderFilesList(files) {
  if (files.length === 0) {
    filesList.innerHTML = `
      <div class="empty-state">
        <h3>📁 Chưa có file nào</h3>
        <p>Hãy upload file đầu tiên của bạn!</p>
      </div>
    `;
    return;
  }
  
  const tableHTML = `
    <table class="files-table">
      <thead>
        <tr>
          <th>Tên file</th>
          <th>Kích thước</th>
          <th>Ngày tạo</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        ${files.map(file => `
          <tr>
            <td>
              <div class="file-name tooltip" data-tooltip="${file.name}">
                ${truncateText(file.name, 40)}
              </div>
            </td>
            <td class="file-size">${formatFileSize(file.size)}</td>
            <td class="file-date">${formatDate(file.createdTime)}</td>
            <td>
              <div class="file-actions">
                <button class="action-btn download-btn" onclick="downloadFile('${file.downloadLink}')">
                  📥 Tải
                </button>
                <button class="action-btn copy-btn" onclick="copyDownloadLink('${file.downloadLink}', '${file.name.replace(/'/g, "\\'")}')">
                  📋 Copy
                </button>
                <button class="action-btn rename-btn" onclick="openRenameModal('${file.id}', '${file.name.replace(/'/g, "\\'")}')">
                  ✏️ Sửa
                </button>
                <button class="action-btn delete-btn" onclick="openDeleteModal('${file.id}', '${file.name.replace(/'/g, "\\'")}')">
                  🗑️ Xóa
                </button>
              </div>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  
  filesList.innerHTML = tableHTML;
}

// Download file
function downloadFile(url) {
  window.open(url, '_blank');
}

// Copy download link to clipboard
async function copyDownloadLink(url, fileName) {
  try {
    await navigator.clipboard.writeText(url);
    showToast(`✅ Đã copy link tải của "${truncateText(fileName, 30)}"`, 'success');
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      showToast(`✅ Đã copy link tải của "${truncateText(fileName, 30)}"`, 'success');
    } catch (fallbackErr) {
      showToast('❌ Không thể copy link. Hãy copy thủ công!', 'error');
    }
    document.body.removeChild(textArea);
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add styles
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    background: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: '10000',
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '14px',
    maxWidth: '300px',
    wordWrap: 'break-word',
    animation: 'slideInRight 0.3s ease'
  });

  // Add to page
  document.body.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 300);
  }, 3000);
}

// Add CSS animations for toast
if (!document.querySelector('#toast-styles')) {
  const style = document.createElement('style');
  style.id = 'toast-styles';
  style.textContent = `
    @keyframes slideInRight {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    
    @keyframes slideOutRight {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(100%);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

// Open rename modal
function openRenameModal(fileId, fileName) {
  currentRenameFileId = fileId;
  renameInput.value = fileName;
  renameModal.style.display = 'block';
  renameInput.focus();
  renameInput.select();
}

// Open delete modal
function openDeleteModal(fileId, fileName) {
  currentDeleteFileId = fileId;
  deleteFileName.textContent = fileName;
  deleteModal.style.display = 'block';
}

// Close modals
function closeModals() {
  renameModal.style.display = 'none';
  deleteModal.style.display = 'none';
  currentRenameFileId = null;
  currentDeleteFileId = null;
}

// Rename file
async function renameFile() {
  const newName = renameInput.value.trim();
  
  if (!newName) {
    showToast('❌ Vui lòng nhập tên file!', 'error');
    return;
  }
  
  try {
    const response = await fetch(`/api/files/${currentRenameFileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: newName })
    });
    
    const data = await response.json();
    
    if (data.success) {
      closeModals();
      
      // Clear files cache before reloading
      const cacheKey = `files_list_${currentUser?.email || 'unknown'}`;
      frontendCache.delete(cacheKey);
      
      loadFiles(true); // Force refresh
      showToast(`✅ Đã đổi tên thành "${truncateText(newName, 30)}"`, 'success');
    } else {
      showToast(`❌ Lỗi: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error renaming file:', error);
    showToast('❌ Có lỗi xảy ra khi đổi tên file!', 'error');
  }
}

// Delete file
async function deleteFile() {
  try {
    const response = await fetch(`/api/files/${currentDeleteFileId}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      closeModals();
      
      // Clear files cache before reloading
      const cacheKey = `files_list_${currentUser?.email || 'unknown'}`;
      frontendCache.delete(cacheKey);
      
      loadFiles(true); // Force refresh
      showToast('✅ Đã xóa file thành công!', 'success');
    } else {
      showToast(`❌ Lỗi: ${data.error}`, 'error');
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    showToast('❌ Có lỗi xảy ra khi xóa file!', 'error');
  }
}

// ======================= UPLOAD FUNCTIONS =======================

// Timer functions
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    timer.textContent = formatTime(elapsed);
  }, 100);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Real upload progress tracking
async function uploadWithProgress(formData, file) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Progress tracking
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        const elapsed = (Date.now() - startTime) / 1000;
        const uploadedBytes = e.loaded;
        
        // Cập nhật progress bar
        progressFill.style.width = percentComplete + '%';
        
        // Tính toán tốc độ upload
        const speed = uploadedBytes / elapsed / (1024 * 1024); // MB/s
        uploadSpeed.textContent = speed.toFixed(2) + ' MB/s';
        
        // Tính thời gian còn lại
        if (speed > 0 && percentComplete < 100) {
          const remainingBytes = e.total - e.loaded;
          const remainingSeconds = remainingBytes / (speed * 1024 * 1024);
          timeRemaining.textContent = formatTime(remainingSeconds);
        } else {
          timeRemaining.textContent = '0:00';
        }
        
        // Cập nhật phần trăm đã upload
        uploadedSize.textContent = Math.round(percentComplete) + '%';
        
        // Cập nhật status text
        if (percentComplete < 20) {
          statusText.innerHTML = '<span class="spinner"></span>Đang kết nối với Google Drive...';
        } else if (percentComplete < 80) {
          statusText.innerHTML = '<span class="spinner"></span>Đang upload file...';
        } else if (percentComplete < 100) {
          statusText.innerHTML = '<span class="spinner"></span>Đang xử lý file...';
        }
      }
    });
    
    // Upload complete
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      } else {
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    });
    
    // Upload error
    xhr.addEventListener('error', () => {
      reject(new Error('Network error occurred'));
    });
    
    // Start upload
    xhr.open('POST', '/upload');
    xhr.send(formData);
  });
}

// ======================= EVENT LISTENERS =======================

// Check auth status when page loads
document.addEventListener('DOMContentLoaded', checkAuthStatus);

// Logout button
logoutBtn.addEventListener('click', logout);

// Tab navigation
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

// Refresh files button - force refresh to bypass cache
refreshBtn.addEventListener('click', () => loadFiles(true));

// Modal event listeners
document.getElementById('cancelRename').addEventListener('click', closeModals);
document.getElementById('confirmRename').addEventListener('click', renameFile);
document.getElementById('cancelDelete').addEventListener('click', closeModals);
document.getElementById('confirmDelete').addEventListener('click', deleteFile);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === renameModal || e.target === deleteModal) {
    closeModals();
  }
});

// Enter key for rename
renameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    renameFile();
  }
});

// Add keyboard shortcut for cache stats (Ctrl+Shift+C)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    console.log('📊 Frontend Cache Stats:', frontendCache.getStats());
    showToast('📊 Cache stats logged to console', 'info');
  }
});

// File selection
fileInput.addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    selectedFile = file;
    
    // Cập nhật label với tên file được cắt ngắn
    const displayName = truncateText(file.name, 40);
    fileLabel.innerHTML = `
      <div class="file-display-name">✅ ${displayName}</div>
      <small>Click để chọn file khác</small>
    `;
    fileLabel.classList.add('has-file');
    
    // Hiển thị thông tin file
    fileName.textContent = file.name;
    setTooltip(fileName, file.name); // Add tooltip for long filenames
    
    fileSize.textContent = formatFileSize(file.size);
    fileType.textContent = file.type || 'Không xác định';
    fileInfo.style.display = 'block';
    
    // Enable upload button
    uploadBtn.disabled = false;
    
    // Reset kết quả cũ
    result.style.display = 'none';
    progressContainer.style.display = 'none';
  }
});

// Drag & Drop support
fileLabel.addEventListener('dragover', function(e) {
  e.preventDefault();
  if (!fileLabel.classList.contains('has-file')) {
    fileLabel.style.borderColor = '#4285f4';
    fileLabel.style.background = '#f0f7ff';
  }
});

fileLabel.addEventListener('dragleave', function(e) {
  e.preventDefault();
  if (!fileLabel.classList.contains('has-file')) {
    fileLabel.style.borderColor = '#ddd';
    fileLabel.style.background = '#fff';
  }
});

fileLabel.addEventListener('drop', function(e) {
  e.preventDefault();
  fileLabel.style.borderColor = '';
  fileLabel.style.background = '';
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    fileInput.files = files;
    fileInput.dispatchEvent(new Event('change'));
  }
});

// Upload form submission
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (!selectedFile) {
    alert('Vui lòng chọn file!');
    return;
  }
  
  if (!currentUser) {
    alert('Vui lòng đăng nhập trước khi upload!');
    return;
  }
  
  // Disable upload button
  uploadBtn.disabled = true;
  uploadBtn.textContent = '⏳ Đang upload...';
  
  // Hiển thị progress
  progressContainer.style.display = 'block';
  result.style.display = 'none';
  
  // Reset progress
  progressFill.style.width = '0%';
  uploadSpeed.textContent = '0 MB/s';
  timeRemaining.textContent = 'Đang tính toán...';
  uploadedSize.textContent = '0%';
  statusText.innerHTML = '<span class="spinner"></span>Đang chuẩn bị upload...';
  
  // Bắt đầu timer
  startTimer();
  
  try {
    // Tạo FormData
    const formData = new FormData(e.target);
    
    // Upload với progress tracking
    const uploadResult = await uploadWithProgress(formData, selectedFile);
    
    // Hoàn thành upload
    progressFill.style.width = '100%';
    uploadedSize.textContent = '100%';
    statusText.innerHTML = '✅ Upload hoàn tất!';
    
    // Dừng timer
    stopTimer();
    
    // Hiển thị kết quả
    result.style.display = 'block';
    
    if (uploadResult.success) {
      result.className = 'result success';
      result.innerHTML = `
        <h3>✅ Upload thành công!</h3>
        <p>File <strong>${truncateText(selectedFile.name, 50)}</strong> đã được upload lên Google Drive bởi <strong>${currentUser.name}</strong>.</p>
        <p><strong>Link tải:</strong></p>
        <a href="${uploadResult.url}" target="_blank" class="result-link">${uploadResult.url}</a>
        <p style="margin-top: 15px;"><small>⏱️ Thời gian upload: ${timer.textContent}</small></p>
      `;
      
      // Clear files cache after successful upload
      const cacheKey = `files_list_${currentUser?.email || 'unknown'}`;
      frontendCache.delete(cacheKey);
      console.log('🗑️ Files cache cleared after successful upload');
      
      // Refresh file list if on manage tab (with slight delay to ensure backend cache is cleared)
      if (document.getElementById('manageTab').classList.contains('active')) {
        setTimeout(() => loadFiles(true), 1500);
      }
    } else {
      result.className = 'result error';
      result.innerHTML = `
        <h3>❌ Upload thất bại!</h3>
        <p>${uploadResult.error || 'Có lỗi xảy ra khi upload file.'}</p>
      `;
    }
    
  } catch (error) {
    console.error('Upload error:', error);
    
    // Dừng timer
    stopTimer();
    
    // Hiển thị lỗi
    result.style.display = 'block';
    result.className = 'result error';
    result.innerHTML = `
      <h3>❌ Có lỗi xảy ra!</h3>
      <p>${error.message || 'Không thể kết nối với server. Vui lòng thử lại.'}</p>
    `;
  } finally {
    // Reset upload button
    uploadBtn.disabled = false;
    uploadBtn.textContent = '🚀 Tải lên Google Drive';
  }
});

// Reset form khi chọn file mới
fileInput.addEventListener('change', function() {
  progressContainer.style.display = 'none';
  result.style.display = 'none';
  stopTimer();
  timer.textContent = '00:00';
});
  