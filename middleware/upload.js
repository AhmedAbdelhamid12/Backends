// middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// إنشاء المجلدات إذا لم تكن موجودة
const createUploadsFolder = (folder) => {
  const dir = path.join(__dirname, '../uploads', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

// تكوين التخزين
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'general';
    
    if (file.fieldname === 'avatar') {
      folder = 'avatars';
    } else if (file.fieldname === 'progress') {
      folder = 'progress';
    } else if (file.fieldname === 'session') {
      folder = 'sessions';
    }
    
    const uploadPath = createUploadsFolder(folder);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// تصفية الملفات
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'application/pdf': true,
    'video/mp4': true,
    'video/avi': true
  };
  
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('نوع الملف غير مسموح به'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
});

// تكوينات محددة
exports.uploadAvatar = upload.single('avatar');
exports.uploadProgressFiles = upload.array('progress', 5);
exports.uploadSessionFiles = upload.array('session', 10);

// معالجة أخطاء التحميل
exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'حجم الملف كبير جداً'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'تم تجاوز الحد الأقصى لعدد الملفات'
      });
    }
  }
  next(err);
};