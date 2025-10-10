const logger = require('../utils/logger');

const requestMonitor = (req, res, next) => {
  const start = Date.now();
  const requestId = require('crypto').randomBytes(8).toString('hex');
  
  req.requestId = requestId;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?._id || 'anonymous',
      contentLength: res.get('Content-Length') || 0
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request Error', logData);
    } else {
      logger.info('HTTP Request', logData);
    }

    if (duration > 10000) {
      logger.warn('Slow Request Detected', {
        ...logData,
        threshold: '10s'
      });
    }
  });

  next();
};

const performanceMonitor = (req, res, next) => {
  const start = process.hrtime();

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const duration = diff[0] * 1e3 + diff[1] * 1e-6;

    if (duration > 1000) {
      logger.warn('High Response Time', {
        url: req.url,
        method: req.method,
        duration: `${duration.toFixed(2)}ms`,
        userId: req.user?._id
      });
    }
  });

  next();
};

const memoryMonitor = (req, res, next) => {
  const memoryUsage = process.memoryUsage();
  const memoryThreshold = 500 * 1024 * 1024;

  if (memoryUsage.heapUsed > memoryThreshold) {
    logger.warn('High Memory Usage', {
      heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`
    });
  }

  next();
};

const dbQueryMonitor = (req, res, next) => {
  const mongoose = require('mongoose');
  const start = Date.now();
  let queryCount = 0;

  mongoose.set('debug', (collectionName, method, query, doc) => {
    queryCount++;
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      logger.warn('Slow Database Query', {
        collection: collectionName,
        method: method,
        query: JSON.stringify(query),
        duration: `${duration}ms`
      });
    }
  });

  res.on('finish', () => {
    if (queryCount > 10) {
      logger.warn('High Database Query Count', {
        url: req.url,
        queryCount: queryCount,
        userId: req.user?._id
      });
    }
  });

  next();
};

module.exports = {
  requestMonitor,
  performanceMonitor,
  memoryMonitor,
  dbQueryMonitor
};