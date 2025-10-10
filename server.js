const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const subscriptionRoutes = require('./routes/subscriptions');
const trainingSessionRoutes = require('./routes/trainingSessions');
const progressRoutes = require('./routes/progress');
const dashboardRoutes = require('./routes/dashboard');
const notificationRoutes = require('./routes/notifications');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: 'تم تجاوز عدد المحاولات المسموح بها' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'تم تجاوز عدد محاولات تسجيل الدخول' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.MOBILE_CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:19006'
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => origin === allowed || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
      callback(null, true);
    } else {
      callback(new Error('CORS error'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

app.options('*', cors());

const createUploadsFolders = () => {
  const baseDir = path.join(__dirname, 'uploads');
  const folders = ['avatars', 'progress/photos', 'progress/videos', 'sessions', 'documents', 'temp'];
  
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });
  
  folders.forEach(folder => {
    const dir = path.join(baseDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};
createUploadsFolders();

if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

const uploadLimit = process.env.UPLOAD_MAX_FILE_SIZE || '10mb';
app.use(express.json({ limit: uploadLimit }));
app.use(express.urlencoded({ extended: true, limit: uploadLimit }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  
  res.status(200).json({
    success: true,
    message: 'نظام إدارة أكاديمية السباحة يعمل بنجاح',
    environment: process.env.NODE_ENV,
    database: statusMap[dbStatus] || 'unknown',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/status', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ success: true, status: dbStatus, environment: process.env.NODE_ENV });
});

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'مرحباً بك في نظام إدارة أكاديمية السباحة',
    version: '2.0.0'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/training-sessions', trainingSessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'مسار API غير موجود' });
});

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'الصفحة غير موجودة' });
});

app.use((error, req, res, next) => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: 'بيانات غير صحيحة', errors });
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({ success: false, message: `هذا ${field} مسجل مسبقاً` });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'رمز الدخول غير صالح' });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'انتهت صلاحية رمز الدخول' });
  }

  res.status(500).json({ 
    success: false, 
    message: process.env.NODE_ENV === 'production' ? 'حدث خطأ في السيرفر' : error.message 
  });
});

const connectDB = async (retries = 5, delay = 5000) => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) throw new Error('MONGODB_URI is required');

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await createDefaultAdmin();
    return conn;
  } catch (error) {
    console.error(`DB connection failed (${retries} retries left):`, error.message);
    
    if (retries > 0) {
      setTimeout(() => connectDB(retries - 1, delay), delay);
    } else {
      process.exit(1);
    }
  }
};

const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const adminEmail = 'admin@swimacademy.com';
    const adminPassword = 'admin123';
    
    const exists = await User.findOne({ email: adminEmail });
    
    if (!exists) {
      const hash = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: 'مدير النظام',
        email: adminEmail,
        password: hash,
        role: 'admin',
        phone: '+201000000000',
        status: 'active',
        emailVerified: true,
      });
      console.log('تم إنشاء الأدمن الافتراضي');
    }
  } catch (err) {
    console.error('Admin creation error:', err.message);
  }
};

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
نظام إدارة أكاديمية السباحة
=================================
السيرفر شغال على: http://localhost:${PORT}
البيئة: ${process.env.NODE_ENV}
قاعدة البيانات: MongoDB Atlas
=================================
      `);
    });

    const { Server } = require('socket.io');
    const io = new Server(server, { cors: { origin: allowedOrigins } });

    io.on('connection', (socket) => {
      socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
      });
    });

    app.set('io', io);

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;