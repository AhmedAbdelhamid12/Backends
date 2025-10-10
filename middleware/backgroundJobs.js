const cron = require('node-cron');
const logger = require('../utils/logger');
const User = require('../models/User');
const Token = require('../models/Token');
const { cacheManager, userCache } = require('./redisCache');

class BackgroundJobManager {
    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.setupCleanupJobs();
        this.setupAnalyticsJobs();
        this.setupMaintenanceJobs();
        
        logger.info('Background jobs started');
    }

    stop() {
        this.isRunning = false;
        this.jobs.forEach(job => job.stop());
        this.jobs.clear();
        logger.info('Background jobs stopped');
    }

    setupCleanupJobs() {
        const cleanupExpiredTokens = cron.schedule('0 2 * * *', async () => {
            try {
                const expiredTokens = await Token.find({ 
                    expiresAt: { $lt: new Date() } 
                });
                
                for (const token of expiredTokens) {
                    await cacheManager.delete(`blacklist:${token.token}`);
                    await token.deleteOne();
                }
                
                logger.info(`Cleaned up ${expiredTokens.length} expired tokens`);
            } catch (error) {
                logger.error('Token cleanup error:', error);
            }
        });

        const cleanupOldCache = cron.schedule('0 4 * * *', async () => {
            try {
                const allKeys = await cacheManager.getKeys('*');
                const now = Date.now();
                let cleanedCount = 0;

                for (const key of allKeys) {
                    const ttl = await this.getKeyTTL(key);
                    if (ttl === -2) {
                        await cacheManager.delete(key);
                        cleanedCount++;
                    }
                }

                logger.info(`Cleaned up ${cleanedCount} expired cache entries`);
            } catch (error) {
                logger.error('Cache cleanup error:', error);
            }
        });

        this.jobs.set('cleanupExpiredTokens', cleanupExpiredTokens);
        this.jobs.set('cleanupOldCache', cleanupOldCache);
    }

    setupAnalyticsJobs() {
        const updateUserStats = cron.schedule('*/5 * * * *', async () => {
            try {
                const activeUsers = await User.countDocuments({ 
                    status: 'active',
                    lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                });
                
                const totalUsers = await User.countDocuments();
                
                await cacheManager.set('stats:users', {
                    activeUsers,
                    totalUsers,
                    updatedAt: new Date().toISOString()
                }, 600);
                
                logger.info(`Updated user stats: ${activeUsers} active, ${totalUsers} total`);
            } catch (error) {
                logger.error('User stats update error:', error);
            }
        });

        this.jobs.set('updateUserStats', updateUserStats);
    }

    setupMaintenanceJobs() {
        const healthCheck = cron.schedule('*/15 * * * *', async () => {
            try {
                const dbCheck = await User.findOne().lean();
                const cacheCheck = await cacheManager.set('health:check', { timestamp: Date.now() }, 60);
                
                const healthStatus = {
                    database: !!dbCheck,
                    cache: cacheCheck,
                    timestamp: new Date().toISOString(),
                    memory: process.memoryUsage(),
                    uptime: process.uptime()
                };

                await cacheManager.set('system:health', healthStatus, 120);
                
                if (!dbCheck || !cacheCheck) {
                    logger.error('System health check failed', healthStatus);
                }
            } catch (error) {
                logger.error('Health check job error:', error);
            }
        });

        this.jobs.set('healthCheck', healthCheck);
    }

    async getKeyTTL(key) {
        const redis = require('../config/redis');
        return await redis.ttl(key);
    }

    async runImmediateCleanup() {
        try {
            const expiredTokens = await Token.find({ 
                expiresAt: { $lt: new Date() } 
            });
            
            let cleanedCount = 0;
            for (const token of expiredTokens) {
                await cacheManager.delete(`blacklist:${token.token}`);
                await token.deleteOne();
                cleanedCount++;
            }
            
            return { cleanedTokens: cleanedCount };
        } catch (error) {
            logger.error('Immediate cleanup error:', error);
            throw error;
        }
    }

    async invalidateUserCache(userId) {
        try {
            await userCache.delete(userId);
            await cacheManager.flushPattern(`user_perms:${userId}:*`);
            logger.info(`Invalidated cache for user: ${userId}`);
            return true;
        } catch (error) {
            logger.error('User cache invalidation error:', error);
            return false;
        }
    }

    async getJobStatus() {
        const status = {};
        for (const [name, job] of this.jobs) {
            status[name] = {
                running: job.getStatus() === 'scheduled',
                lastExecution: job.lastExecution() || 'Never'
            };
        }
        return status;
    }
}

const jobManager = new BackgroundJobManager();

module.exports = jobManager;