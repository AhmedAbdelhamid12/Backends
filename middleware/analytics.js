const logger = require('../utils/logger');
const User = require('../models/User');

const trackPageView = (req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    logger.info('Page View', {
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id,
      timestamp: new Date().toISOString()
    });
  }
  next();
};

const trackAPIUsage = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const analyticsData = {
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
      userId: req.user?._id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    };

    logger.info('API Usage', analyticsData);

    if (req.user) {
      updateUserAnalytics(req.user._id, analyticsData);
    }
  });

  next();
};

const updateUserAnalytics = async (userId, analyticsData) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { 'analytics.apiCalls': 1 },
      $set: { 
        'analytics.lastActive': new Date(),
        'analytics.lastEndpoint': analyticsData.endpoint
      },
      $push: {
        'analytics.recentActivity': {
          endpoint: analyticsData.endpoint,
          method: analyticsData.method,
          timestamp: analyticsData.timestamp,
          duration: analyticsData.duration
        }
      }
    });
  } catch (error) {
    logger.error('Failed to update user analytics:', error);
  }
};

const trackConversion = (event, data = {}) => {
  return (req, res, next) => {
    if (req.method === 'POST' || req.method === 'PUT') {
      logger.info('Conversion Event', {
        event: event,
        ...data,
        userId: req.user?._id,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
};

const featureUsage = (feature) => {
  return (req, res, next) => {
    logger.info('Feature Usage', {
      feature: feature,
      userId: req.user?._id,
      userRole: req.user?.role,
      timestamp: new Date().toISOString()
    });
    next();
  };
};

module.exports = {
  trackPageView,
  trackAPIUsage,
  trackConversion,
  featureUsage
};