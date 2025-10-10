const Joi = require('joi');

const envVarsSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test', 'staging').default('development'),
  PORT: Joi.number().default(5000),
  DOMAIN: Joi.string().default('localhost'),

  MONGODB_URI: Joi.string().required().description('MongoDB connection string is required'),

  JWT_SECRET: Joi.string().required().description('JWT secret key is required'),
  JWT_EXPIRE: Joi.string().default('7d'),
  SESSION_SECRET: Joi.string().default('session_secret_2024'),

  GOOGLE_CLIENT_ID: Joi.string().allow(''),
  GOOGLE_CLIENT_SECRET: Joi.string().allow(''),

  CLIENT_URL: Joi.string().default('http://localhost:3000'),
  MOBILE_CLIENT_URL: Joi.string().default('http://localhost:19006'),
  ADMIN_PANEL_URL: Joi.string().default('http://localhost:3001'),

  EMAIL_SERVICE: Joi.string().default('gmail'),
  EMAIL_USER: Joi.string().default('enterprise@swimacademy.com'),
  EMAIL_PASS: Joi.string().allow(''),
  EMAIL_FROM: Joi.string().default('Swim Academy <noreply@swimacademy.com>'),

  CLOUDINARY_CLOUD_NAME: Joi.string().allow(''),
  CLOUDINARY_API_KEY: Joi.string().allow(''),
  CLOUDINARY_API_SECRET: Joi.string().allow(''),

  UPLOAD_MAX_FILE_SIZE: Joi.string().default('50mb'),
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  BCRYPT_ROUNDS: Joi.number().default(12),

  DEFAULT_ADMIN_EMAIL: Joi.string().default('admin@swimacademy.com'),
  DEFAULT_ADMIN_PASSWORD: Joi.string().default('Admin123!'),
  DEFAULT_ADMIN_PHONE: Joi.string().default('+201000000000'),

  SUPPORT_EMAIL: Joi.string().default('support@swimacademy.com'),
  SUPPORT_PHONE: Joi.string().default('+201234567890'),

  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),

  MONITORING_ENABLED: Joi.boolean().default(true),
  BACKUP_ENABLED: Joi.boolean().default(true),
  APP_NAME: Joi.string().default('Swim Academy Pro'),
}).unknown();

const { value: envVars, error } = envVarsSchema.validate(process.env, { abortEarly: false });

if (error) {
  throw new Error(`❌ Environment validation error:\n${error.details.map(d => d.message).join('\n')}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  domain: envVars.DOMAIN,

  mongoose: {
    url: envVars.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    },
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    expire: envVars.JWT_EXPIRE,
  },

  session: {
    secret: envVars.SESSION_SECRET,
  },

  oauth: {
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
    },
  },

  clients: {
    web: envVars.CLIENT_URL,
    mobile: envVars.MOBILE_CLIENT_URL,
    admin: envVars.ADMIN_PANEL_URL,
  },

  email: {
    service: envVars.EMAIL_SERVICE,
    user: envVars.EMAIL_USER,
    pass: envVars.EMAIL_PASS,
    from: envVars.EMAIL_FROM,
  },

  cloudinary: {
    cloudName: envVars.CLOUDINARY_CLOUD_NAME,
    apiKey: envVars.CLOUDINARY_API_KEY,
    apiSecret: envVars.CLOUDINARY_API_SECRET,
  },

  security: {
    uploadMaxSize: envVars.UPLOAD_MAX_FILE_SIZE,
    rateLimitWindowMs: envVars.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
    bcryptRounds: envVars.BCRYPT_ROUNDS,
  },

  admin: {
    email: envVars.DEFAULT_ADMIN_EMAIL,
    password: envVars.DEFAULT_ADMIN_PASSWORD,
    phone: envVars.DEFAULT_ADMIN_PHONE,
  },

  support: {
    email: envVars.SUPPORT_EMAIL,
    phone: envVars.SUPPORT_PHONE,
  },

  logging: {
    level: envVars.LOG_LEVEL,
  },

  monitoring: {
    enabled: envVars.MONITORING_ENABLED,
    backupEnabled: envVars.BACKUP_ENABLED,
  },

  app: {
    name: envVars.APP_NAME,
  },
};

module.exports = config;
