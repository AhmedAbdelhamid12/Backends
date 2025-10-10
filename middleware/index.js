const { errorHandler } = require('./errorHandler');
const { auth, authorize } = require('./auth');
const { validateRequest } = require('./validation');
const securityMiddleware = require('./security');
const { 
  authLimiter, 
  apiLimiter, 
  createRouteLimiter 
} = require('./rateLimiter');
const { 
  uploadAvatar, 
  uploadProgressFiles, 
  handleUploadError 
} = require('./upload');
const { 
  requestMonitor, 
  performanceMonitor,
  healthCheck
} = require('./monitoring');
const { maintenanceMode } = require('./maintenance');
const { localeMiddleware } = require('./i18n');
const { compressionMiddleware } = require('./compression');
const { timeoutConfig } = require('./timeout');
const { cacheMiddleware } = require('./cache');
const { 
  trackAPIUsage, 
  trackPageView 
} = require('./analytics');
const { 
  cacheManager,
  userCache,
  apiCache 
} = require('./redisCache');
const jobManager = require('./backgroundJobs');
const { getConfig } = require('./config');

module.exports = {
  errorHandler,
  auth,
  authorize,
  validateRequest,
  securityMiddleware,
  authLimiter,
  apiLimiter,
  createRouteLimiter,
  uploadAvatar,
  uploadProgressFiles,
  handleUploadError,
  requestMonitor,
  performanceMonitor,
  healthCheck,
  maintenanceMode,
  localeMiddleware,
  compressionMiddleware,
  timeoutConfig,
  cacheMiddleware,
  trackAPIUsage,
  trackPageView,
  cacheManager,
  userCache,
  apiCache,
  jobManager,
  getConfig
};