const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const User = require('../models/User');

// 🔧 إعدادات معدل الحدود المتقدمة
const RATE_LIMIT_CONFIG = {
  // الإعدادات العامة
  enableRedis: process.env.REDIS_ENABLED === 'true',
  trustProxy: process.env.TRUST_PROXY === 'true',
  
  // الرسائل المخصصة
  messages: {
    tooManyRequests: 'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة مرة أخرى بعد',
    tooManyAuthAttempts: 'تم تجاوز عدد محاولات الدخول المسموح بها. يرجى المحاولة مرة أخرى بعد',
    tooManyUploads: 'تم تجاوز عدد عمليات الرفع المسموح بها. يرجى المحاولة مرة أخرى بعد',
    tooManyEmails: 'تم تجاوز عدد رسائل البريد الإلكتروني المسموح بها. يرجى المحاولة مرة أخرى بعد'
  },
  
  // الاستثناءات
  skip: (req, res) => {
    // تخطي معدل الحدود للمشرفين
    return req.user?.role === 'admin';
  },
  
  // معالجة تجاوز الحدود
  onLimitReached: (req, res, options) => {
    logger.warn(`Rate limit reached for ${req.ip} on ${req.path}`, {
      ip: req.ip,
      path: req.path,
      method: req.method,
      user: req.user?._id || 'anonymous',
      userAgent: req.get('User-Agent')
    });
  }
};

// 🎯 مخزن معدل الحدود (Redis أو Memory)
const getStore = () => {
  if (RATE_LIMIT_CONFIG.enableRedis && redis) {
    return new RedisStore({
      sendCommand: (...args) => redis.call(...args),
      prefix: 'rl:'
    });
  }
  return undefined; // استخدام المخزن الافتراضي في الذاكرة
};

// 🔐 معدل الحد للتحقق من الهوية المتقدم
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: async (req) => {
    // تحدد الحد الأقصى بناءً على حالة المستخدم
    if (req.user) {
      return 10; // مستخدم مسجل لديه محاولات أكثر
    }
    
    // التحقق من عنوان IP للمستخدمين المجهولين
    const ip = req.ip;
    const isSuspiciousIP = await checkSuspiciousIP(ip);
    
    return isSuspiciousIP ? 3 : 5; // حدود أقل للعنواين المشبوهة
  },
  message: {
    success: false,
    message: `${RATE_LIMIT_CONFIG.messages.tooManyAuthAttempts} 15 دقيقة`,
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: RATE_LIMIT_CONFIG.skip,
  store: getStore(),
  handler: (req, res, next, options) => {
    RATE_LIMIT_CONFIG.onLimitReached(req, res, options);
    
    // تسجيل محاولة الدخول الفاشلة
    logFailedAuthAttempt(req);
    
    res.status(429).json(options.message);
  }
});

// 🌐 معدل الحد العام للـ API المتقدم
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: async (req) => {
    // حدود مختلفة بناءً على دور المستخدم
    if (req.user) {
      switch (req.user.role) {
        case 'admin':
          return 1000;
        case 'coach':
          return 500;
        case 'user':
          return 200;
        default:
          return 100;
      }
    }
    return 50; // المستخدمين المجهولين
  },
  message: {
    success: false,
    message: `${RATE_LIMIT_CONFIG.messages.tooManyRequests} 15 دقيقة`,
    code: 'API_RATE_LIMIT_EXCEEDED',
    retryAfter: '15 دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: RATE_LIMIT_CONFIG.skip,
  store: getStore(),
  handler: (req, res, next, options) => {
    RATE_LIMIT_CONFIG.onLimitReached(req, res, options);
    res.status(429).json(options.message);
  }
});

// 📧 معدل الحد لإرسال البريد الإلكتروني
const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 5, // 5 رسائل بريد إلكتروني في الساعة
  message: {
    success: false,
    message: `${RATE_LIMIT_CONFIG.messages.tooManyEmails} ساعة`,
    code: 'EMAIL_RATE_LIMIT_EXCEEDED',
    retryAfter: 'ساعة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  keyGenerator: (req) => {
    // استخدام البريد الإلكتروني كمفتاح إذا كان متوفراً
    return req.body.email || req.ip;
  }
});

// 📁 معدل الحد لرفع الملفات
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 10, // 10 عملية رفع في الساعة
  message: {
    success: false,
    message: `${RATE_LIMIT_CONFIG.messages.tooManyUploads} ساعة`,
    code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    retryAfter: 'ساعة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// 🔍 معدل الحد لعمليات البحث
const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // دقيقة واحدة
  max: 30, // 30 عملية بحث في الدقيقة
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح لعمليات البحث. يرجى المحاولة مرة أخرى بعد دقيقة',
    code: 'SEARCH_RATE_LIMIT_EXCEEDED',
    retryAfter: 'دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// 💳 معدل الحد للمدفوعات
const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 دقائق
  max: 5, // 5 عمليات دفع كل 10 دقائق
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح لعمليات الدفع. يرجى المحاولة مرة أخرى بعد 10 دقائق',
    code: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    retryAfter: '10 دقائق'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// 🎯 معدل الحد مخصص للمسارات المحددة
const createRouteLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    message: {
      success: false,
      message: options.message || `${RATE_LIMIT_CONFIG.messages.tooManyRequests} ${getTimeString(options.windowMs)}`,
      code: options.code || 'CUSTOM_RATE_LIMIT_EXCEEDED',
      retryAfter: getTimeString(options.windowMs)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: options.skip || RATE_LIMIT_CONFIG.skip,
    store: getStore(),
    ...options
  });
};

// 🔐 معدل الحد الحساس (للكلمات السرية، إعادة التعيين، إلخ)
const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 3, // 3 محاولات فقط في الساعة
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح للمحاولات. يرجى المحاولة مرة أخرى بعد ساعة',
    code: 'SENSITIVE_OPERATION_LIMIT_EXCEEDED',
    retryAfter: 'ساعة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  handler: (req, res, next, options) => {
    RATE_LIMIT_CONFIG.onLimitReached(req, res, options);
    
    // إشعار إداري للعمليات الحساسة
    notifyAdminOfSuspiciousActivity(req);
    
    res.status(429).json(options.message);
  }
});

// 📊 معدل الحد للإحصائيات والتقارير
const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 دقائق
  max: 10, // 10 طلبات إحصائيات كل 5 دقائق
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح لطلبات التقارير. يرجى المحاولة مرة أخرى بعد 5 دقائق',
    code: 'ANALYTICS_RATE_LIMIT_EXCEEDED',
    retryAfter: '5 دقائق'
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore()
});

// 🔧 معدل الحد الديناميكي بناءً على الحمل
const dynamicLimiter = (defaultMax = 100) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
      // تقليل الحدود أثناء فترات الذروة
      const hour = new Date().getHours();
      const isPeakHour = (hour >= 9 && hour <= 12) || (hour >= 14 && hour <= 17);
      
      return isPeakHour ? Math.floor(defaultMax * 0.7) : defaultMax;
    },
    message: {
      success: false,
      message: `${RATE_LIMIT_CONFIG.messages.tooManyRequests} 15 دقيقة`,
      code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
      retryAfter: '15 دقيقة'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore()
  });
};

// 🛡️ معدل الحد للعنواين المشبوهة
const suspiciousIPLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // ساعة واحدة
  max: 2, // محاولتان فقط في الساعة للعنواين المشبوهة
  message: {
    success: false,
    message: 'تم اكتشاف نشاط غير عادي. يرجى المحاولة مرة أخرى بعد ساعة',
    code: 'SUSPICIOUS_ACTIVITY_DETECTED',
    retryAfter: 'ساعة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // لا يتم تطبيقه إلا على العنواين المشبوهة
    return !isSuspiciousIP(req.ip);
  },
  store: getStore()
});

// 🔧 دوال مساعدة

// التحقق من عنوان IP مشبوه
const isSuspiciousIP = async (ip) => {
  try {
    // هنا يمكنك دمج مع خدمات مثل AbuseIPDB أو الحفاظ على قائمة محلية
    const suspiciousIPs = await getSuspiciousIPsList();
    return suspiciousIPs.includes(ip);
  } catch (error) {
    logger.error('Error checking suspicious IP:', error);
    return false;
  }
};

// الحصول على قائمة العنواين المشبوهة
const getSuspiciousIPsList = async () => {
  // في التطبيق الحقيقي، يمكن جلب هذه من قاعدة بيانات أو Redis
  if (RATE_LIMIT_CONFIG.enableRedis && redis) {
    const ips = await redis.get('suspicious_ips');
    return ips ? JSON.parse(ips) : [];
  }
  return [];
};

// تسجيل محاولة الدخول الفاشلة
const logFailedAuthAttempt = (req) => {
  logger.warn('Failed authentication attempt due to rate limiting', {
    ip: req.ip,
    email: req.body.email,
    path: req.path,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
};

// إشعار الإدارة بالنشاط المشبوه
const notifyAdminOfSuspiciousActivity = (req) => {
  logger.error('Suspicious activity detected and rate limited', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    body: sanitizeRequestBody(req.body),
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
  
  // هنا يمكن إرسال بريد إلكتروني للمشرفين
  // أو إشعار في نظام الإشعارات
};

// تنظيف جسم الطلب من البيانات الحساسة
const sanitizeRequestBody = (body) => {
  const sanitized = { ...body };
  const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'cvv'];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***';
    }
  });
  
  return sanitized;
};

// تحويل الوقت إلى نص مقروء
const getTimeString = (ms) => {
  const minutes = Math.floor(ms / (60 * 1000));
  const hours = Math.floor(ms / (60 * 60 * 1000));
  
  if (hours >= 1) {
    return `${hours} ساعة${hours > 1 ? 'ات' : ''}`;
  } else if (minutes >= 1) {
    return `${minutes} دقيقة${minutes > 1 ? 'ات' : ''}`;
  } else {
    return 'بضع ثوان';
  }
};

// 🎯 Middleware للتحقق من معدل الحدود المخصص
const checkRateLimit = async (req, res, next) => {
  try {
    const routeConfig = getRouteRateLimitConfig(req.path, req.method);
    
    if (routeConfig) {
      const limiter = createRouteLimiter(routeConfig);
      return limiter(req, res, next);
    }
    
    next();
  } catch (error) {
    logger.error('Rate limit check error:', error);
    next();
  }
};

// الحصول على إعدادات معدل الحدود للمسار
const getRouteRateLimitConfig = (path, method) => {
  const routeConfigs = {
    '/api/auth/login': { windowMs: 15 * 60 * 1000, max: 5, message: 'تم تجاوز عدد محاولات الدخول' },
    '/api/auth/register': { windowMs: 60 * 60 * 1000, max: 3, message: 'تم تجاوز عدد محاولات التسجيل' },
    '/api/auth/forgot-password': { windowMs: 60 * 60 * 1000, max: 3, message: 'تم تجاوز عدد طلبات إعادة التعيين' },
    '/api/upload': { windowMs: 60 * 60 * 1000, max: 10, message: 'تم تجاوز عدد عمليات الرفع' },
    '/api/payments': { windowMs: 10 * 60 * 1000, max: 5, message: 'تم تجاوز عدد عمليات الدفع' }
  };
  
  return routeConfigs[path];
};

// 📊 إحصائيات معدل الحدود
const getRateLimitStats = async () => {
  if (!RATE_LIMIT_CONFIG.enableRedis || !redis) {
    return { message: 'إحصائيات معدل الحدود غير متاحة بدون Redis' };
  }
  
  try {
    const keys = await redis.keys('rl:*');
    const stats = {};
    
    for (const key of keys) {
      const count = await redis.get(key);
      stats[key] = parseInt(count) || 0;
    }
    
    return stats;
  } catch (error) {
    logger.error('Error getting rate limit stats:', error);
    return { error: 'فشل في جلب الإحصائيات' };
  }
};

module.exports = {
  // المحددات الأساسية
  authLimiter,
  apiLimiter,
  emailLimiter,
  uploadLimiter,
  searchLimiter,
  paymentLimiter,
  analyticsLimiter,
  sensitiveLimiter,
  suspiciousIPLimiter,
  dynamicLimiter,
  
  // المحددات القابلة للتخصيص
  createRouteLimiter,
  checkRateLimit,
  
  // الأدوات المساعدة
  getRateLimitStats,
  RATE_LIMIT_CONFIG
};