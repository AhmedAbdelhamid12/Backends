const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const createUploadsFolder = (folder) => {
  const dir = path.join(__dirname, '../uploads', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'general';
    
    if (file.fieldname === 'avatar') {
      folder = 'avatars';
    } else if (file.fieldname === 'progress') {
      folder = 'progress';
    } else if (file.fieldname === 'session') {
      folder = 'sessions';
    } else if (file.fieldname === 'document') {
      folder = 'documents';
    } else if (file.fieldname === 'media') {
      folder = 'media';
    }
    
    const uploadPath = createUploadsFolder(folder);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileHash = crypto.randomBytes(16).toString('hex');
    const ext = path.extname(file.originalname);
    const originalName = path.parse(file.originalname).name;
    const safeName = originalName.replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${safeName}-${fileHash}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/webp': true,
    'image/gif': true,
    'application/pdf': true,
    'application/msword': true,
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
    'video/mp4': true,
    'video/mpeg': true,
    'video/quicktime': true,
    'video/x-msvideo': true,
    'audio/mpeg': true,
    'audio/wav': true,
    'audio/ogg': true
  };

  if (allowedMimes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`نوع الملف غير مدعوم: ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 10
  },
  fileFilter: fileFilter
});

const uploadConfigs = {
  avatar: {
    single: upload.single('avatar'),
    limits: {
      fileSize: 2 * 1024 * 1024,
      files: 1
    },
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  },
  progress: {
    array: upload.array('progress', 5),
    limits: {
      fileSize: 10 * 1024 * 1024,
      files: 5
    },
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'application/pdf']
  },
  session: {
    array: upload.array('session', 10),
    limits: {
      fileSize: 15 * 1024 * 1024,
      files: 10
    },
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'video/mpeg']
  },
  documents: {
    array: upload.array('documents', 3),
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 3
    },
    allowedTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  },
  media: {
    array: upload.array('media', 8),
    limits: {
      fileSize: 20 * 1024 * 1024,
      files: 8
    },
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'video/mp4', 'audio/mpeg']
  }
};

exports.uploadAvatar = uploadConfigs.avatar.single;
exports.uploadProgressFiles = uploadConfigs.progress.array;
exports.uploadSessionFiles = uploadConfigs.session.array;
exports.uploadDocuments = uploadConfigs.documents.array;
exports.uploadMedia = uploadConfigs.media.array;

exports.handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    let message = 'خطأ في تحميل الملف';
    
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'حجم الملف يتجاوز الحد المسموح';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      message = 'تم تجاوز الحد الأقصى لعدد الملفات';
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'نوع الملف غير مسموح به';
    } else if (err.code === 'LIMIT_PART_COUNT') {
      message = 'عدد أجزاء الملف كبير جداً';
    } else if (err.code === 'LIMIT_FIELD_KEY') {
      message = 'اسم حقل الملف طويل جداً';
    } else if (err.code === 'LIMIT_FIELD_VALUE') {
      message = 'قيمة حقل الملف طويلة جداً';
    } else if (err.code === 'LIMIT_FIELD_COUNT') {
      message = 'عدد حقول الملف كبير جداً';
    }

    return res.status(400).json({
      success: false,
      message,
      errorCode: err.code
    });
  }

  if (err.message && err.message.includes('نوع الملف غير مدعوم')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next(err);
};

exports.validateFileType = (allowedTypes) => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return next();
    }

    const files = req.file ? [req.file] : req.files;
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.mimetype));

    if (invalidFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'أنواع الملفات غير مسموح بها',
        invalidFiles: invalidFiles.map(file => ({
          name: file.originalname,
          type: file.mimetype
        }))
      });
    }

    next();
  };
};

exports.cleanupUploadedFiles = (req, res, next) => {
  const cleanup = () => {
    if (req.file || req.files) {
      const files = req.file ? [req.file] : req.files;
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error('فشل في حذف الملف:', file.path, err);
            }
          });
        }
      });
    }
  };

  res.on('finish', cleanup);
  res.on('close', cleanup);
  next();
};

exports.getFileUrl = (file) => {
  if (!file) return null;
  
  const filename = path.basename(file.path);
  let folder = 'general';
  
  if (file.fieldname === 'avatar') folder = 'avatars';
  else if (file.fieldname === 'progress') folder = 'progress';
  else if (file.fieldname === 'session') folder = 'sessions';
  else if (file.fieldname === 'document') folder = 'documents';
  else if (file.fieldname === 'media') folder = 'media';
  
  return `/uploads/${folder}/${filename}`;
};