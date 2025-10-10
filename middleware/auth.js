const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// Get Redis client - handle both sync and async cases
let redisClient = null;
const getRedis = () => {
  if (!redisClient) {
    try {
      redisClient = require('../config/redis');
    } catch (err) {
      logger.warn('Redis not available, using in-memory cache');
      // Create a simple in-memory cache as fallback
      const cache = new Map();
      redisClient = {
        get: async (key) => cache.get(key) || null,
        set: async (key, value) => { cache.set(key, value); return 'OK'; },
        setex: async (key, seconds, value) => { 
          cache.set(key, value);
          setTimeout(() => cache.delete(key), seconds * 1000);
          return 'OK';
        },
        del: async (...keys) => {
          let count = 0;
          keys.forEach(k => { if (cache.delete(k)) count++; });
          return count;
        },
        exists: async (...keys) => keys.filter(k => cache.has(k)).length
      };
    }
  }
  return redisClient;
};
const redis = getRedis();

const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutTime: 30 * 60 * 1000,
  tokenRefreshMargin: 15 * 60 * 1000,
  blacklistCleanupInterval: 24 * 60 * 60 * 1000
};

const parseExpiryToSeconds = (expiresIn) => {
  if (typeof expiresIn === 'number') {
    return expiresIn;
  }
  
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 3600; // Default to 1 hour
  }
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  const multipliers = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400
  };
  
  return value * (multipliers[unit] || 3600);
};

const addToBlacklist = async (token, expiresIn = '1h') => {
  const expirySeconds = parseExpiryToSeconds(expiresIn);
  await redis.setex(`blacklist:${token}`, expirySeconds, '1');
  return Date.now() + (expirySeconds * 1000);
};

const isTokenBlacklisted = async (token) => {
  return await redis.exists(`blacklist:${token}`);
};

const userCache = {
  get: async (userId) => {
    const cached = await redis.get(`user:${userId}`);
    return cached ? JSON.parse(cached) : null;
  },
  set: async (userId, userData, ttl = 300) => {
    await redis.setex(`user:${userId}`, ttl, JSON.stringify(userData));
  },
  delete: async (userId) => {
    await redis.del(`user:${userId}`);
  }
};

exports.auth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'الوصول مرفوع. يرجى تسجيل الدخول.' 
      });
    }

    if (await isTokenBlacklisted(token)) {
      return res.status(401).json({ 
        success: false,
        message: 'جلسة الدخول منتهية. يرجى تسجيل الدخول مرة أخرى.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type && decoded.type !== 'access') {
      return res.status(401).json({ 
        success: false,
        message: 'نوع التوكن غير صالح' 
      });
    }

    let user = await userCache.get(decoded.userId || decoded.id);
    
    if (!user) {
      user = await User.findById(decoded.userId || decoded.id)
        .select('-password -resetPasswordToken -emailVerificationToken')
        .lean();
      
      if (user) {
        await userCache.set(user._id.toString(), user);
      }
    }
    
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

    req.user = user;
    req.token = token;
    req.tokenExpiry = decoded.exp;

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

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return next();
    }

    if (await isTokenBlacklisted(token)) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    let user = await userCache.get(decoded.userId || decoded.id);
    
    if (!user) {
      user = await User.findById(decoded.userId || decoded.id)
        .select('-password -resetPasswordToken -emailVerificationToken')
        .lean();
    }
    
    if (user && user.status === 'active') {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    next();
  }
};

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

exports.requireOwnership = (model, idParam = 'id') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[idParam];
      const userId = req.user._id;
      const userRole = req.user.role;

      if (userRole === 'admin') {
        return next();
      }

      const resource = await model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: 'المورد غير موجود'
        });
      }

      let isOwner = false;
      
      if (resource.userId && resource.userId.toString() === userId.toString()) {
        isOwner = true;
      } else if (resource.coachId && resource.coachId.toString() === userId.toString()) {
        isOwner = true;
      } else if (resource.createdBy && resource.createdBy.toString() === userId.toString()) {
        isOwner = true;
      }

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

exports.refreshTokenIfNeeded = async (req, res, next) => {
  if (!req.shouldRefreshToken || !req.user) {
    return next();
  }

  try {
    const newToken = generateToken(req.user);
    
    await addToBlacklist(req.token, process.env.JWT_EXPIRE || '1h');
    
    res.set('X-New-Access-Token', newToken);
    
    logger.info(`Token refreshed for user: ${req.user.email}`);
    
    next();
  } catch (error) {
    logger.error('Token refresh error:', error);
    next();
  }
};

exports.securityHeaders = (req, res, next) => {
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

exports.createRateLimiter = (options = {}) => {
  return RateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 5,
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

exports.systemCheck = (req, res, next) => {
  if (process.env.MAINTENANCE_MODE === 'true') {
    return res.status(503).json({
      success: false,
      message: 'النظام تحت الصيانة. يرجى المحاولة مرة أخرى لاحقاً.',
      estimatedRestoration: process.env.MAINTENANCE_UNTIL
    });
  }
  
  next();
};

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

const extractToken = (req) => {
  const authHeader = req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '');
  }
  
  if (req.query.token) {
    return req.query.token;
  }
  
  return null;
};

const shouldRefreshToken = (expiry) => {
  const now = Date.now() / 1000;
  const timeUntilExpiry = expiry - now;
  const refreshMargin = SECURITY_CONFIG.tokenRefreshMargin / 1000;
  
  return timeUntilExpiry <= refreshMargin;
};

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

exports.addToBlacklist = addToBlacklist;
exports.isTokenBlacklisted = isTokenBlacklisted;
exports.generateToken = generateToken;
exports.userCache = userCache;

module.exports = exports;