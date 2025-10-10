const config = {
    security: {
        jwtSecret: process.env.JWT_SECRET || 'fallback-secret-change-in-production',
        jwtExpire: process.env.JWT_EXPIRE || '1h',
        refreshTokenExpire: '7d',
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        lockoutTime: 30 * 60 * 1000,
        tokenRefreshMargin: 15 * 60 * 1000
    },

    rateLimiting: {
        api: { 
            windowMs: 15 * 60 * 1000, 
            max: parseInt(process.env.API_RATE_LIMIT) || 100 
        },
        auth: { 
            windowMs: 15 * 60 * 1000, 
            max: parseInt(process.env.AUTH_RATE_LIMIT) || 5 
        },
        upload: { 
            windowMs: 60 * 60 * 1000, 
            max: parseInt(process.env.UPLOAD_RATE_LIMIT) || 10 
        },
        search: { 
            windowMs: 1 * 60 * 1000, 
            max: 30 
        }
    },

    upload: {
        maxFileSize: 15 * 1024 * 1024,
        maxFiles: 10,
        allowedMimeTypes: [
            'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo',
            'audio/mpeg', 'audio/wav', 'audio/ogg'
        ]
    },

    cache: {
        userTTL: 300,
        permissionsTTL: 600,
        apiTTL: 60,
        redisEnabled: process.env.REDIS_ENABLED === 'true'
    },

    monitoring: {
        slowRequestThreshold: 10000,
        highResponseTimeThreshold: 1000,
        memoryThreshold: 500 * 1024 * 1024,
        dbQueryThreshold: 1000
    },

    backgroundJobs: {
        cleanupSchedule: '0 2 * * *',
        analyticsSchedule: '*/5 * * * *',
        healthCheckSchedule: '*/15 * * * *'
    }
};

const getConfig = (path, defaultValue = null) => {
    const keys = path.split('.');
    let value = config;
    
    for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
            value = value[key];
        } else {
            return defaultValue;
        }
    }
    
    return value;
};

const validateConfig = () => {
    const required = [
        'security.jwtSecret',
        'security.jwtExpire',
        'rateLimiting.api.max',
        'rateLimiting.auth.max'
    ];

    const errors = [];
    
    for (const path of required) {
        if (!getConfig(path)) {
            errors.push(`Missing configuration: ${path}`);
        }
    }

    if (getConfig('security.jwtSecret') === 'fallback-secret-change-in-production') {
        errors.push('JWT secret must be changed in production');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

const updateConfig = (updates) => {
    Object.keys(updates).forEach(key => {
        const keys = key.split('.');
        let current = config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = updates[key];
    });
    
    return { success: true, updated: Object.keys(updates) };
};

module.exports = {
    config,
    getConfig,
    validateConfig,
    updateConfig
};