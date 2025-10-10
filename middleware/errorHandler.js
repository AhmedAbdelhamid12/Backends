const logger = require('../utils/logger');
const { createNotification } = require('../controllers/notificationController');

// 🛡️ إعدادات معالج الأخطاء المتقدم
const ERROR_CONFIG = {
  showStack: process.env.NODE_ENV === 'development',
  logErrors: process.env.LOG_ERRORS !== 'false',
  notifyAdmins: process.env.NOTIFY_ADMINS_ON_ERROR === 'true',
  adminEmails: process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',') : [],
  maxErrorLength: 1000,
  sanitizeData: true
};

// 🎯 تصنيفات الأخطاء
const ERROR_CATEGORIES = {
  VALIDATION: 'validation',
  DATABASE: 'database',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NETWORK: 'network',
  FILESYSTEM: 'filesystem',
  BUSINESS: 'business',
  INTEGRATION: 'integration',
  UNKNOWN: 'unknown'
};

// 🔧 صناع الأخطاء المخصصة
class AppError extends Error {
  constructor(message, statusCode, category = ERROR_CATEGORIES.BUSINESS, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.category = category;
    this.details = details;
    this.isOperational = true;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400, ERROR_CATEGORIES.VALIDATION, { errors });
    this.name = 'ValidationError';
  }
}

class DatabaseError extends AppError {
  constructor(message, operation = 'unknown') {
    super(message, 500, ERROR_CATEGORIES.DATABASE, { operation });
    this.name = 'DatabaseError';
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'المصادقة مطلوبة') {
    super(message, 401, ERROR_CATEGORIES.AUTHENTICATION);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'ليس لديك الصلاحية') {
    super(message, 403, ERROR_CATEGORIES.AUTHORIZATION);
    this.name = 'AuthorizationError';
  }
}

// 🛡️ معالج الأخطاء المركزي المتقدم
const errorHandler = (err, req, res, next) => {
  // إنشاء معرف فريد للخطأ
  const errorId = generateErrorId();
  const errorContext = buildErrorContext(err, req, errorId);
  
  // تسجيل الخطأ
  logError(err, errorContext);
  
  // إشعار المشرفين إذا كان خطأ حرج
  if (shouldNotifyAdmins(err)) {
    notifyAdmins(err, errorContext).catch(notificationError => {
      logger.error('Failed to notify admins:', notificationError);
    });
  }
  
  // تنظيف البيانات الحساسة
  const safeError = sanitizeError(err);
  
  // إرسال الرد المناسب
  sendErrorResponse(res, safeError, errorContext);
};

// 🎯 معالج للدوال غير المتزامنة
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 🎯 معالج للدوال غير المتزامنة مع التتبع
const asyncHandlerWithTracking = (fn, operationName = 'unknown') => {
  return async (req, res, next) => {
    const startTime = Date.now();
    try {
      await fn(req, res, next);
      const duration = Date.now() - startTime;
      logger.info(`Operation completed: ${operationName}`, {
        operation: operationName,
        duration: `${duration}ms`,
        userId: req.user?._id,
        path: req.path
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      error.operation = operationName;
      error.duration = duration;
      next(error);
    }
  };
};

// 🔧 معالجة أنواع الأخطاء المختلفة
const handleSpecificErrors = (err) => {
  let handledError = { ...err };
  
  // 📝 خطأ في التحقق من البيانات (Mongoose Validation)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => ({
      field: val.path,
      message: val.message,
      value: val.value
    }));
    
    handledError = new ValidationError('بيانات غير صحيحة', messages);
  }

  // 🔄 تكرار البيانات (Mongoose Duplicate Key)
  else if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    let message = getDuplicateFieldMessage(field, value);
    handledError = new ValidationError(message, [{ field, value }]);
  }

  // 🔐 خطأ في JWT
  else if (err.name === 'JsonWebTokenError') {
    handledError = new AuthenticationError('رمز الدخول غير صالح');
  }

  // ⏰ انتهاء صلاحية JWT
  else if (err.name === 'TokenExpiredError') {
    handledError = new AuthenticationError('انتهت صلاحية رمز الدخول. يرجى تسجيل الدخول مرة أخرى');
  }

  // 📁 خطأ في تحميل الملفات (Multer)
  else if (err.code && err.code.startsWith('LIMIT_')) {
    handledError = handleMulterError(err);
  }

  // 🗄️ خطأ في MongoDB - كائن غير موجود
  else if (err.name === 'CastError') {
    handledError = new ValidationError(`المعرف غير صحيح: ${err.value}`);
  }

  // 🌐 أخطاء الشبكة
  else if (err.code === 'ECONNREFUSED') {
    handledError = new AppError('تعذر الاتصال بالخادم', 503, ERROR_CATEGORIES.NETWORK);
  }

  else if (err.code === 'ETIMEDOUT') {
    handledError = new AppError('انتهت مهلة الاتصال', 408, ERROR_CATEGORIES.NETWORK);
  }

  // 💾 أخطاء النظام
  else if (err.code === 'ENOSPC') {
    handledError = new AppError('مساحة التخزين غير كافية', 507, ERROR_CATEGORIES.FILESYSTEM);
  }

  else if (err.code === 'EMFILE') {
    handledError = new AppError('تم فتح الكثير من الملفات', 503, ERROR_CATEGORIES.FILESYSTEM);
  }

  // 🔌 أخطاء التكامل
  else if (err.isAxiosError) {
    handledError = handleAxiosError(err);
  }

  // معالجة الأخطاء المخصصة
  else if (err instanceof AppError) {
    // الأخطاء المخصصة معالجة مسبقاً
    handledError = err;
  }

  // ⚠️ خطأ غير معروف
  else {
    handledError = new AppError(
      err.message || 'حدث خطأ غير متوقع في النظام',
      err.statusCode || 500,
      ERROR_CATEGORIES.UNKNOWN
    );
  }

  return handledError;
};

// 🔧 دوال مساعدة

// إنشاء معرف فريد للخطأ
const generateErrorId = () => {
  return require('crypto').randomBytes(8).toString('hex');
};

// بناء سياق الخطأ
const buildErrorContext = (err, req, errorId) => {
  return {
    errorId,
    timestamp: new Date().toISOString(),
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?._id || 'غير مسجل',
    userEmail: req.user?.email,
    params: ERROR_CONFIG.sanitizeData ? sanitizeObject(req.params) : req.params,
    query: ERROR_CONFIG.sanitizeData ? sanitizeObject(req.query) : req.query,
    body: ERROR_CONFIG.sanitizeData ? sanitizeObject(req.body) : req.body,
    headers: sanitizeHeaders(req.headers)
  };
};

// تسجيل الخطأ
const logError = (err, context) => {
  if (!ERROR_CONFIG.logErrors) return;

  const logData = {
    ...context,
    errorName: err.name,
    errorMessage: err.message,
    errorStack: ERROR_CONFIG.showStack ? err.stack : undefined,
    statusCode: err.statusCode,
    category: err.category || ERROR_CATEGORIES.UNKNOWN,
    operation: err.operation,
    duration: err.duration
  };

  // تصنيف مستوى التسجيل
  if (err.statusCode >= 500) {
    logger.error('Server Error', logData);
  } else if (err.statusCode >= 400) {
    logger.warn('Client Error', logData);
  } else {
    logger.info('Application Error', logData);
  }
};

// تنظيف البيانات الحساسة
const sanitizeError = (err) => {
  const safeError = { ...err };
  
  // إزالة البيانات الحساسة من الرسالة
  if (safeError.message && ERROR_CONFIG.sanitizeData) {
    safeError.message = safeError.message.replace(/password=['"][^'"]*['"]/gi, 'password=***');
    safeError.message = safeError.message.replace(/token=['"][^'"]*['"]/gi, 'token=***');
  }
  
  // تقليل حجم البيانات
  if (safeError.details && typeof safeError.details === 'object') {
    safeError.details = JSON.stringify(safeError.details).substring(0, ERROR_CONFIG.maxErrorLength);
  }
  
  return safeError;
};

// إرسال رد الخطأ
const sendErrorResponse = (res, err, context) => {
  const statusCode = err.statusCode || 500;
  const response = {
    success: false,
    message: err.message,
    errorId: context.errorId,
    statusCode,
    category: err.category,
    timestamp: context.timestamp
  };

  // إضافة التفاصيل للأخطاء التي تحتاجها
  if (err.details && statusCode < 500) {
    response.details = err.details;
  }

  // في وضع التطوير، إضافة المزيد من المعلومات
  if (ERROR_CONFIG.showStack) {
    response.stack = err.stack;
    response.context = {
      url: context.url,
      method: context.method
    };
  }

  res.status(statusCode).json(response);
};

// التحقق إذا كان يجب إشعار المشرفين
const shouldNotifyAdmins = (err) => {
  if (!ERROR_CONFIG.notifyAdmins) return false;
  
  return (
    err.statusCode >= 500 || // أخطاء الخادم
    err.category === ERROR_CATEGORIES.DATABASE || // أخطاء قاعدة البيانات
    err.name === 'DatabaseError' ||
    (err.statusCode === 429 && err.message.includes('Rate limit')) // تجاوز الحدود
  );
};

// إشعار المشرفين
const notifyAdmins = async (err, context) => {
  if (ERROR_CONFIG.adminEmails.length === 0) return;

  const notificationMessage = `
🚨 خطأ في النظام 🚨

معرف الخطأ: ${context.errorId}
الوقت: ${context.timestamp}
المسار: ${context.method} ${context.url}
المستخدم: ${context.userEmail || context.userId}
نوع الخطأ: ${err.name}
الرسالة: ${err.message}
الحالة: ${err.statusCode}
التصنيف: ${err.category}

تفاصيل إضافية:
${JSON.stringify(context, null, 2)}
  `.trim();

  // هنا يمكن إرسال بريد إلكتروني أو إشعار داخلي
  logger.error('Admin Notification Required:', {
    errorId: context.errorId,
    message: err.message,
    severity: 'HIGH'
  });

  // مثال: إرسال إشعار للمشرفين عبر نظام الإشعارات
  for (const adminId of await getAdminUsers()) {
    await createNotification(
      adminId,
      '🚨 خطأ في النظام',
      `حدث خطأ حرج في النظام. معرف الخطأ: ${context.errorId}`,
      {
        type: 'error',
        category: 'system',
        priority: 'high',
        actionUrl: `/admin/errors/${context.errorId}`
      }
    );
  }
};

// معالجة أخطاء Multer
const handleMulterError = (err) => {
  const errors = {
    LIMIT_FILE_SIZE: 'حجم الملف كبير جداً. الحد الأقصى 10MB',
    LIMIT_FILE_COUNT: 'تم تجاوز الحد الأقصى لعدد الملفات',
    LIMIT_FIELD_KEY: 'اسم الحقل طويل جداً',
    LIMIT_FIELD_VALUE: 'قيمة الحقل طويلة جداً',
    LIMIT_FIELD_COUNT: 'عدد الحقول كبير جداً',
    LIMIT_UNEXPECTED_FILE: 'نوع الملف غير مسموح به'
  };

  const message = errors[err.code] || 'خطأ في تحميل الملف';
  return new AppError(message, 400, ERROR_CATEGORIES.FILESYSTEM, { code: err.code });
};

// معالجة أخطاء Axios
const handleAxiosError = (err) => {
  if (err.response) {
    // الخطأ من الخادم البعيد
    const status = err.response.status;
    const message = `خطأ في خدمة خارجية: ${status}`;
    return new AppError(message, 502, ERROR_CATEGORIES.INTEGRATION, {
      externalService: err.config?.url,
      externalStatus: status
    });
  } else if (err.request) {
    // لم يتم استلام رد
    return new AppError('تعذر الاتصال بالخدمة الخارجية', 503, ERROR_CATEGORIES.INTEGRATION);
  } else {
    // خطأ في الإعداد
    return new AppError('خطأ في تكامل الخدمات', 500, ERROR_CATEGORIES.INTEGRATION);
  }
};

// رسائل الحقول المكررة
const getDuplicateFieldMessage = (field, value) => {
  const messages = {
    email: `البريد الإلكتروني ${value} مسجل مسبقاً`,
    phone: `رقم الهاتف ${value} مسجل مسبقاً`,
    username: `اسم المستخدم ${value} مسجل مسبقاً`,
    nationalId: `رقم الهوية ${value} مسجل مسبقاً`
  };

  return messages[field] || `قيمة ${field} مكررة: ${value}`;
};

// تنظيف الكائنات من البيانات الحساسة
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sensitiveFields = ['password', 'token', 'secret', 'authorization', 'cookie'];
  const sanitized = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  return sanitized;
};

// تنظيف الرؤوس
const sanitizeHeaders = (headers) => {
  const safeHeaders = { ...headers };
  const sensitiveHeaders = ['authorization', 'cookie', 'x-auth-token'];
  
  sensitiveHeaders.forEach(header => {
    if (safeHeaders[header]) {
      safeHeaders[header] = '***';
    }
  });
  
  return safeHeaders;
};

// الحصول على قائمة المشرفين
const getAdminUsers = async () => {
  try {
    const User = require('../models/User');
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');
    return admins.map(admin => admin._id);
  } catch (error) {
    logger.error('Failed to get admin users:', error);
    return [];
  }
};

// 🎯 Middleware للتعامل مع الـ 404
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `المسار غير موجود - ${req.originalUrl}`,
    404,
    ERROR_CATEGORIES.BUSINESS
  );
  next(error);
};

// 🎯 Middleware للتعامل مع الـ 405
const methodNotAllowedHandler = (req, res, next) => {
  const error = new AppError(
    `الطريقة ${req.method} غير مسموحة للمسار ${req.originalUrl}`,
    405,
    ERROR_CATEGORIES.BUSINESS
  );
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  asyncHandlerWithTracking,
  notFoundHandler,
  methodNotAllowedHandler,
  AppError,
  ValidationError,
  DatabaseError,
  AuthenticationError,
  AuthorizationError,
  ERROR_CATEGORIES
};