const redis = require('redis');
const logger = require('../utils/logger');

let client = null;

// إنشاء عميل Redis
const createRedisClient = async () => {
  try {
    // إذا لم يكن Redis متاحاً في البيئة، استخدم mock client مباشرة
    if (!process.env.REDIS_URL && process.env.NODE_ENV !== 'production') {
      logger.info('Redis not configured, using mock client');
      return createMockClient();
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    client = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            logger.warn('Redis reconnection failed after 10 attempts, using mock client');
            return false; // Stop reconnecting
          }
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 5000
      }
    });

    client.on('connect', () => {
      logger.info('Redis client connecting...');
    });

    client.on('ready', () => {
      logger.info('Redis client ready');
    });

    client.on('error', (err) => {
      logger.warn('Redis client error:', err.message);
      // لا نغلق العميل، بل نستخدم mock client
      if (!client.isOpen) {
        client = createMockClient();
      }
    });

    client.on('end', () => {
      logger.warn('Redis client connection ended');
    });

    // محاولة الاتصال - مع معالجة أفضل للأخطاء
    try {
      await Promise.race([
        client.connect(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        )
      ]);
      logger.info('Redis connected successfully');
    } catch (err) {
      logger.warn('Redis connection failed, using mock client:', err.message);
      // في حالة فشل الاتصال، نستخدم عميل وهمي
      try {
        if (client && client.isOpen) {
          await client.quit();
        }
      } catch (quitErr) {
        // Ignore quit errors
      }
      client = createMockClient();
    }

    return client;
  } catch (error) {
    logger.warn('Redis initialization error, using mock client:', error.message);
    // في حالة الخطأ، نستخدم عميل وهمي
    return createMockClient();
  }
};

// إنشاء عميل وهمي للاستخدام في حالة عدم توفر Redis
const createMockClient = () => {
  logger.warn('Using mock Redis client - Redis features will be limited');
  
  const mockData = new Map();
  
  return {
    get: async (key) => {
      return mockData.get(key) || null;
    },
    set: async (key, value) => {
      mockData.set(key, value);
      return 'OK';
    },
    setex: async (key, seconds, value) => {
      mockData.set(key, value);
      setTimeout(() => mockData.delete(key), seconds * 1000);
      return 'OK';
    },
    del: async (...keys) => {
      let deleted = 0;
      keys.forEach(key => {
        if (mockData.delete(key)) deleted++;
      });
      return deleted;
    },
    exists: async (...keys) => {
      return keys.filter(key => mockData.has(key)).length;
    },
    incr: async (key) => {
      const current = parseInt(mockData.get(key) || '0');
      const newValue = current + 1;
      mockData.set(key, newValue.toString());
      return newValue;
    },
    expire: async (key, seconds) => {
      if (mockData.has(key)) {
        setTimeout(() => mockData.delete(key), seconds * 1000);
        return 1;
      }
      return 0;
    },
    ttl: async (key) => {
      return mockData.has(key) ? -1 : -2;
    },
    keys: async (pattern) => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return Array.from(mockData.keys()).filter(key => regex.test(key));
    },
    info: async () => {
      return `used_memory_human:${mockData.size}KB\nconnected_clients:1`;
    },
    connect: async () => {
      logger.info('Mock Redis client ready');
    },
    disconnect: async () => {
      mockData.clear();
    },
    quit: async () => {
      mockData.clear();
    }
  };
};

// الحصول على عميل Redis أو إنشاء واحد جديد
const getRedisClient = async () => {
  if (!client) {
    client = await createRedisClient();
  }
  return client;
};

// Initialize immediately with a promise (non-blocking)
let clientPromise = null;
const initClient = async () => {
  if (!clientPromise) {
    clientPromise = createRedisClient();
  }
  return clientPromise;
};

// Start initialization immediately (non-blocking)
initClient().catch(err => {
  logger.warn('Redis initialization deferred:', err.message);
});

// Get client synchronously - returns promise in development, or mock client immediately
const getRedisClientSync = () => {
  if (client) {
    return client;
  }
  // Return mock client immediately if not initialized yet
  return createMockClient();
};

// إغلاق الاتصال بشكل صحيح
const closeRedisConnection = async () => {
  if (client && typeof client.quit === 'function') {
    try {
      // Check if it's a real Redis client (has isOpen property)
      if (client.isOpen !== undefined && client.isOpen) {
        await client.quit();
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Error closing Redis connection:', error);
    }
  }
};

// معالجة إغلاق التطبيق
process.on('SIGINT', async () => {
  await closeRedisConnection();
});

process.on('SIGTERM', async () => {
  await closeRedisConnection();
});

// Export sync version that always returns a client (mock if not ready)
module.exports = getRedisClientSync();

