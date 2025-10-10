const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// تكوينات الأمان
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutTime: 30 * 60 * 1000, // 30 دقيقة
  tokenRefreshMargin: 15 * 60 * 1000, // 15 دقيقة
  blacklistCleanupInterval: 24 * 60 * 60 * 1000 // 24 ساعة
};

// قائمة سوداء للتوكينات (في production استخدم Redis)
const tokenBlacklist = new Set();

// تنظيف القائمة السوداء دورياً
setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlacklist.entries()) {
    if (expiry < now) {
      tokenBlacklist.delete(token);
    }
  }
}, SECURITY_CONFIG.blacklistCleanupInterval);

// إضافة توكن للقائمة السوداء
const addToBlacklist = (token, expiresIn = '1h') => {
  const expiryTime = Date.now() + (parseInt(expiresIn) * 1000 || 3600000);
  tokenBlacklist.add(token);
  return expiryTime;
};

// التحقق من وجود التوكن في القائمة السوداء
const isTokenBlacklisted = (token) => {
  return tokenBlacklist.has(token);
};

// middleware المصادقة الرئيسي
exports.auth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'الوصول مرفوع. يرجى تسجيل الدخول.' 
      });
    }

    // التحقق من القائمة السوداء
    if (isTokenBlacklisted(token)) {
      return res.status(401).json({ 
        success: false,
        message: 'جلسة الدخول منتهية. يرجى تسجيل الدخول مرة أخرى.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // التحقق من نوع التوكن
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({ 
        success: false,
        message: 'نوع التوكن غير صالح' 
      });
    }

    const user = await User.findById(decoded.userId || decoded.id)
      .select('-password -resetPasswordToken -emailVerificationToken');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'المستخدم غير موجود' 
      });
    }

    if (user.status !== 'active') {
      const statusMessages = {
        'inactive': 'الحساب غير مفعل',
        'suspended': 'الحساب موقوف. يرجى التواصل مع الدعم.',
        'pending': 'الحساب ينتظر التحقق من البريد الإلكتروني',
        'deleted': 'الحساب محذوف'
      };
      
      return res.status(403).json({ 
        success: false,
        message: statusMessages[user.status] || 'الحساب غير نشط',
        status: user.status
      });
    }

    // تحديث آخر نشاط
    user.lastActive = new Date();
    await user.save();

    // إضافة معلومات إضافية للطلب
    req.user = user;
    req.token = token;
    req.tokenExpiry = decoded.exp;

    // التحقق إذا كان التوكن يحتاج للتجديد
    if (shouldRefreshToken(decoded.exp)) {
      req.shouldRefreshToken = true;
    }

    logger.info(`User authenticated: ${user.email}`, {
      userId: user._id,
      role: user.role,
      ip: req.ip
    });

    next();
  } catch (error) {
    handleAuthError(error, res);
  }
};

// middleware للمصادقة الاختيارية (للمسارات العامة)
exports.optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next();
    }

    if (isTokenBlacklisted(token)) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId || decoded.id)
      .select('-password -resetPasswordToken -emailVerificationToken');
    
    if (user && user.status === 'active') {
      req.user = user;
      req.token = token;
      
      // تحديث آخر نشاط
      user.lastActive = new Date();
      await user.save();
    }

    next();
  } catch (error) {
    // في المصادقة الاختيارية، نستمر حتى مع وجود خطأ
    next();
  }
};

// middleware التحقق من الصلاحيات
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'المصادقة مطلوبة للوصول إلى هذا المسار'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by ${req.user.email} to ${req.path}`, {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية للوصول إلى هذا المسار',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// middleware التحقق من ملكية المورد
exports.requireOwnership = (model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const userId = req.user._id;
      const userRole = req.user.role;

      // الأدمن لديه صلاحية كاملة
      if (userRole === 'admin') {
        return next();
      }

      // البحث عن المورد والتحقق من الملكية
      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }

      // التحقق من الملكية بناءً على نموذج المورد
      let isOwner = false;
      
      if (resource.userId && resource.userId.toString() === userId.toString()) {
        isOwner = true;
      } else if (resource.coachId && resource.coachId.toString() === userId.toString()) {
        isOwner = true;
      } else if (resource.createdBy && resource.createdBy.toString() === userId.toString()) {
        isOwner = true;
      }

      // المدرب يمكنه الوصول لموارد متدربيه
      if (!isOwner && userRole === 'coach') {
        if (resource.userId) {
          const trainee = await User.findById(resource.userId);
          if (trainee && trainee.coaches && trainee.coaches.includes(userId)) {
            isOwner = true;
          }
        }
      }

      if (!isOwner) {
        logger.warn(`Ownership violation attempt by ${req.user.email} for resource ${resourceId}`, {
          userId: req.user._id,
          resourceId: resourceId,
          resourceType: model.modelName,
          ip: req.ip
        });

        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        message: 'خطأ في التحقق من الصلاحيات'
      });
    }
  };
};

// middleware التحقق من التوكن وتجديده إذا لزم الأمر
exports.refreshTokenIfNeeded = async (req, res, next) => {
  if (!req.shouldRefreshToken || !req.user) {
    return next();
  }

  try {
    const newToken = generateToken(req.user);
    
    // إضافة التوكن القديم للقائمة السوداء
    addToBlacklist(req.token, process.env.JWT_EXPIRE || '1h');
    
    // إرسال التوكن الجديد في الرد
    res.set('X-New-Access-Token', newToken);
    
    logger.info(`Token refreshed for user: ${req.user.email}`);
    
    next();
  } catch (error) {
    logger.error('Token refresh error:', error);
    next(); // نستمر حتى مع فشل التجديد
  }
};

// middleware حماية من الهجمات
exports.securityHeaders = (req, res, next) => {
  // رؤوس أمان إضافية
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'",
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  
  next();
};

// middleware الحد من المحاولات
exports.createRateLimiter = (options = {}) => {
  return RateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 دقيقة
    max: options.max || 5, // 5 محاولات
    message: {
      success: false,
      message: options.message || 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة مرة أخرى لاحقاً.'
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.ip} on ${req.path}`, {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent')
      });
      
      res.status(429).json({
        success: false,
        message: 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة مرة أخرى بعد 15 دقيقة.'
      });
    },
    ...options
  });
};

// middleware التحقق من حالة النظام
exports.systemCheck = (req, res, next) => {
  // هنا يمكن إضافة تحقق من حالة قاعدة البيانات، الذاكرة، etc.
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      success: false,
      message: 'النظام تحت الصيانة. يرجى المحاولة مرة أخرى لاحقاً.',
      estimatedRestoration: process.env.MAINTENANCE_UNTIL
    });
  }
  
  next();
};

// middleware تسجيل طلبات API
exports.apiLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id || 'anonymous'
    };
    
    if (res.statusCode >= 400) {
      logger.warn('API Request Error', logData);
    } else {
      logger.info('API Request', logData);
    }
  });
  
  next();
};

// middleware التحقق من صحة البيانات
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'بيانات الطلب غير صالحة',
        errors
      });
    }
    
    req.body = value;
    next();
  };
};

// دوال مساعدة

// استخراج التوكن من الطلب
const extractToken = (req) => {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }
  
  // البحث عن التوكن في query parameters (لـ WebSockets وغيرها)
  if (req.query.token) {
    return req.query.token;
  }
  
  return null;
};

// التحقق إذا كان التوكن يحتاج للتجديد
const shouldRefreshToken = (expiry) => {
  const now = Date.now() / 1000;
  const timeUntilExpiry = expiry - now;
  const refreshMargin = SECURITY_CONFIG.tokenRefreshMargin / 1000;
  
  return timeUntilExpiry <= refreshMargin;
};

// إنشاء توكن جديد
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id, 
      role: user.role,
      email: user.email,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '1h' }
  );
};

// معالجة أخطاء المصادقة
const handleAuthError = (error, res) => {
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ 
      success: false,
      message: 'انتهت صلاحية جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.',
      code: 'TOKEN_EXPIRED'
    });
  }
  
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ 
      success: false,
      message: 'رمز الدخول غير صالح',
      code: 'INVALID_TOKEN'
    });
  }
  
  logger.error('Authentication middleware error:', error);
  
  res.status(500).json({ 
    success: false,
    message: 'خطأ في المصادقة'
  });
};

// تصدير دوال مساعدة للاستخدام الخارجي
exports.addToBlacklist = addToBlacklist;
exports.isTokenBlacklisted = isTokenBlacklisted;
exports.generateToken = generateToken;

module.exports = exports;