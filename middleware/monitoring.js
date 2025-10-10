const logger = require('../utils/logger');
const { cacheStats } = require('./redisCache');
const os = require('os');

const performanceMetrics = {
    requests: new Map(),
    errors: new Map(),
    responseTimes: []
};

const trackOperation = async (operation, duration, success = true) => {
    const timestamp = Date.now();
    const metric = {
        operation,
        duration,
        success,
        timestamp,
        memory: process.memoryUsage(),
        load: os.loadavg()
    };

    performanceMetrics.responseTimes.push(metric);
    
    if (performanceMetrics.responseTimes.length > 1000) {
        performanceMetrics.responseTimes = performanceMetrics.responseTimes.slice(-500);
    }

    if (!success) {
        const errorCount = performanceMetrics.errors.get(operation) || 0;
        performanceMetrics.errors.set(operation, errorCount + 1);
    }

    const opCount = performanceMetrics.requests.get(operation) || 0;
    performanceMetrics.requests.set(operation, opCount + 1);
};

const requestMonitor = (req, res, next) => {
    const start = Date.now();
    const requestId = require('crypto').randomBytes(8).toString('hex');
    
    req.requestId = requestId;

    res.on('finish', async () => {
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

        await trackOperation(req.path, duration, res.statusCode < 400);

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

    const originalDebug = mongoose.get('debug');
    
    mongoose.set('debug', (collectionName, method, query, doc) => {
        queryCount++;
        const duration = Date.now() - start;
        
        if (duration > 1000) {
            logger.warn('Slow Database Query', {
                collection: collectionName,
                method: method,
                query: JSON.stringify(query).substring(0, 200),
                duration: `${duration}ms`
            });
        }
    });

    res.on('finish', () => {
        mongoose.set('debug', originalDebug);
        
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

const healthCheck = async (req, res) => {
    try {
        const cacheStatsData = await cacheStats.getStats();
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: `${Math.floor(uptime / 60)} minutes`,
            memory: {
                heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
                heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
                rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)}MB`
            },
            system: {
                load: os.loadavg(),
                freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)}GB`,
                totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)}GB`
            },
            cache: cacheStatsData,
            performance: {
                totalRequests: Array.from(performanceMetrics.requests.values()).reduce((a, b) => a + b, 0),
                errorCount: Array.from(performanceMetrics.errors.values()).reduce((a, b) => a + b, 0),
                avgResponseTime: performanceMetrics.responseTimes.length > 0 
                    ? performanceMetrics.responseTimes.reduce((a, b) => a + b.duration, 0) / performanceMetrics.responseTimes.length 
                    : 0
            }
        };

        res.json(health);
    } catch (error) {
        logger.error('Health check error:', error);
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
};

const getPerformanceMetrics = () => {
    return {
        requests: Object.fromEntries(performanceMetrics.requests),
        errors: Object.fromEntries(performanceMetrics.errors),
        responseTimes: performanceMetrics.responseTimes.slice(-100),
        timestamp: new Date().toISOString()
    };
};

const resetMetrics = () => {
    performanceMetrics.requests.clear();
    performanceMetrics.errors.clear();
    performanceMetrics.responseTimes = [];
};

module.exports = {
    requestMonitor,
    performanceMonitor,
    memoryMonitor,
    dbQueryMonitor,
    healthCheck,
    getPerformanceMetrics,
    resetMetrics,
    trackOperation
};