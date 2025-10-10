const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const User = require('../models/User');
const { rateLimitCache } = require('./redisCache');

const RATE_LIMIT_CONFIG = {
  enableRedis: process.env.REDIS_ENABLED === 'true',
  trustProxy: process.env.TRUST_PROXY === 'true',
  
  messages: {
    tooManyRequests: 'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة مرة أخرى بعد',
    tooManyAuthAttempts: 'تم تجاوز عدد محاولات الدخول المسموح بها. يرجى المحاولة مرة أخرى بعد',
    tooManyUploads: 'تم تجاوز عدد عمليات الرفع المسموح بها. يرجى المحاولة مرة أخرى بعد',
    tooManyEmails: 'تم تجاوز عدد رسائل البريد الإلكتروني المسموح بها. يرجى المحاولة مرة أخرى بعد'
  },
  
  skip: (req, res) => {
    return req.user?.role === 'admin';
  },
  
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

const getStore = () => {
  if (RATE_LIMIT_CONFIG.enableRedis && redis) {
    try {
      return new RedisStore({
        client: redis,
        prefix: 'rl:'
      });
    } catch (error) {
      logger.warn('Failed to create Redis store for rate limiting:', error.message);
      return undefined;
    }
  }
  return undefined;
};

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: async (req) => {
    if (req.user) {
      return 10;
    }
    
    const ip = req.ip;
    const isSuspicious = await isSuspiciousIP(ip);
    
    return isSuspicious ? 3 : 5;
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
    
    logFailedAuthAttempt(req);
    
    res.status(429).json(options.message);
  }
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: async (req) => {
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
    return 50;
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

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
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
    return req.body.email || req.ip;
  }
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
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

const searchLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
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

const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
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

const sensitiveLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
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
    
    notifyAdminOfSuspiciousActivity(req);
    
    res.status(429).json(options.message);
  }
});

const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 10,
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

const dynamicLimiter = (defaultMax = 100) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: (req) => {
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

const suspiciousIPLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 2,
  message: {
    success: false,
    message: 'تم اكتشاف نشاط غير عادي. يرجى المحاولة مرة أخرى بعد ساعة',
    code: 'SUSPICIOUS_ACTIVITY_DETECTED',
    retryAfter: 'ساعة'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Note: skip function cannot be async, so we'll check synchronously
    // For a more robust solution, pre-populate a cache of suspicious IPs
    return false; // Always apply the limiter, the check is done in handler
  },
  store: getStore(),
  handler: async (req, res, next, options) => {
    const isSuspicious = await isSuspiciousIP(req.ip);
    if (!isSuspicious) {
      return next(); // Skip if not suspicious
    }
    RATE_LIMIT_CONFIG.onLimitReached(req, res, options);
    res.status(429).json(options.message);
  }
});

const isSuspiciousIP = async (ip) => {
  try {
    const suspiciousIPs = await getSuspiciousIPsList();
    return suspiciousIPs.includes(ip);
  } catch (error) {
    logger.error('Error checking suspicious IP:', error);
    return false;
  }
};

const getSuspiciousIPsList = async () => {
  if (RATE_LIMIT_CONFIG.enableRedis && redis) {
    const ips = await redis.get('suspicious_ips');
    return ips ? JSON.parse(ips) : [];
  }
  return [];
};

const logFailedAuthAttempt = (req) => {
  logger.warn('Failed authentication attempt due to rate limiting', {
    ip: req.ip,
    email: req.body.email,
    path: req.path,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
};

const notifyAdminOfSuspiciousActivity = (req) => {
  logger.error('Suspicious activity detected and rate limited', {
    ip: req.ip,
    path: req.path,
    method: req.method,
    body: sanitizeRequestBody(req.body),
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
};

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
  
  createRouteLimiter,
  checkRateLimit,
  
  getRateLimitStats,
  RATE_LIMIT_CONFIG
};