const redis = require('../config/redis');
const logger = require('../utils/logger');

const cacheManager = {
    async get(key) {
        try {
            const cached = await redis.get(key);
            return cached ? JSON.parse(cached) : null;
        } catch (error) {
            logger.error('Cache get error:', error);
            return null;
        }
    },

    async set(key, data, ttl = 300) {
        try {
            await redis.setex(key, ttl, JSON.stringify(data));
            return true;
        } catch (error) {
            logger.error('Cache set error:', error);
            return false;
        }
    },

    async delete(key) {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error:', error);
            return false;
        }
    },

    async exists(key) {
        try {
            return await redis.exists(key);
        } catch (error) {
            logger.error('Cache exists error:', error);
            return false;
        }
    },

    async increment(key, ttl = 3600) {
        try {
            const count = await redis.incr(key);
            if (count === 1) {
                await redis.expire(key, ttl);
            }
            return count;
        } catch (error) {
            logger.error('Cache increment error:', error);
            return 0;
        }
    },

    async getKeys(pattern) {
        try {
            return await redis.keys(pattern);
        } catch (error) {
            logger.error('Cache getKeys error:', error);
            return [];
        }
    },

    async flushPattern(pattern) {
        try {
            const keys = await redis.keys(pattern);
            if (keys.length > 0) {
                await redis.del(...keys);
            }
            return keys.length;
        } catch (error) {
            logger.error('Cache flushPattern error:', error);
            return 0;
        }
    }
};

const userCache = {
    async get(userId) {
        return await cacheManager.get(`user:${userId}`);
    },

    async set(userId, userData, ttl = 300) {
        return await cacheManager.set(`user:${userId}`, userData, ttl);
    },

    async delete(userId) {
        return await cacheManager.delete(`user:${userId}`);
    },

    async invalidateUser(userId) {
        await cacheManager.delete(`user:${userId}`);
        await cacheManager.flushPattern(`user_perms:${userId}:*`);
    }
};

const permissionCache = {
    async get(userId, resource) {
        return await cacheManager.get(`user_perms:${userId}:${resource}`);
    },

    async set(userId, resource, permissions, ttl = 600) {
        return await cacheManager.set(`user_perms:${userId}:${resource}`, permissions, ttl);
    },

    async delete(userId, resource) {
        return await cacheManager.delete(`user_perms:${userId}:${resource}`);
    }
};

const apiCache = {
    async get(endpoint, params = {}) {
        const key = `api:${endpoint}:${JSON.stringify(params)}`;
        return await cacheManager.get(key);
    },

    async set(endpoint, params = {}, data, ttl = 60) {
        const key = `api:${endpoint}:${JSON.stringify(params)}`;
        return await cacheManager.set(key, data, ttl);
    },

    async invalidateEndpoint(endpoint) {
        const pattern = `api:${endpoint}:*`;
        return await cacheManager.flushPattern(pattern);
    }
};

const rateLimitCache = {
    async increment(key, windowMs) {
        const count = await cacheManager.increment(key);
        await redis.expire(key, Math.ceil(windowMs / 1000));
        return count;
    },

    async get(key) {
        const count = await redis.get(key);
        return parseInt(count) || 0;
    },

    async reset(key) {
        await redis.del(key);
    }
};

const cacheStats = {
    async getStats() {
        try {
            const info = await redis.info();
            const keys = await redis.keys('*');
            
            return {
                totalKeys: keys.length,
                userKeys: keys.filter(k => k.startsWith('user:')).length,
                apiKeys: keys.filter(k => k.startsWith('api:')).length,
                memoryUsage: info.match(/used_memory_human:(\S+)/)?.[1] || '0',
                connectedClients: info.match(/connected_clients:(\d+)/)?.[1] || '0'
            };
        } catch (error) {
            logger.error('Cache stats error:', error);
            return {};
        }
    }
};

module.exports = {
    cacheManager,
    userCache,
    permissionCache,
    apiCache,
    rateLimitCache,
    cacheStats
};