// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// معدل الحد للتحقق من الهوية
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 5, // 5 محاولات كحد أقصى
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح لمحاولات الدخول. يرجى المحاولة مرة أخرى بعد 15 دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// معدل الحد العام للـ API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 دقيقة
  max: 100, // 100 طلب كحد أقصى
  message: {
    success: false,
    message: 'تم تجاوز الحد المسموح للطلبات. يرجى المحاولة مرة أخرى بعد 15 دقيقة'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authLimiter,
  apiLimiter
};