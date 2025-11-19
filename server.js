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
const equipmentRoutes = require('./routes/equipment');
const eventRoutes = require('./routes/events');
const courseRoutes = require('./routes/courses');
const attendanceRoutes = require('./routes/attendance');
const achievementRoutes = require('./routes/achievements');
const videoRoutes = require('./routes/videos');
const academyRoutes = require('./routes/academies');
const teamRoutes = require('./routes/teams');
const exerciseRoutes = require('./routes/exercises');
const nutritionPlanRoutes = require('./routes/nutritionPlans');
const competitionRoutes = require('./routes/competitions');
const paymentRoutes = require('./routes/payments');
const statsRoutes = require('./routes/stats');
const passport = require('./config/passport');

const app = express();

app.use(passport.initialize());

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

if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}

app.use(mongoSanitize());
app.use(xss());
app.use(hpp());
app.use(compression());

const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.MOBILE_CLIENT_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
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

// Serve static files from public directory (React build)
const publicPath = path.join(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
}

app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const statusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  
  res.status(200).json({
    success: true,
    message: 'Academy Multi M - Professional Academy Management System',
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
    message: 'Welcome to Academy Multi M - Professional Academy Management System',
    version: '4.0.0',
    endpoints: {
      health: '/health',
      api: '/api',
      docs: '/docs'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/training-sessions', trainingSessionRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/academies', academyRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/nutrition-plans', nutritionPlanRoutes);
app.use('/api/competitions', competitionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'مسار API غير موجود' });
});

// Serve React frontend for all non-API routes
app.use('*', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ success: false, message: 'الصفحة غير موجودة' });
  }
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
    
    if (!mongoURI) {
      const errorMsg = 'MONGODB_URI is required. Please set it in your .env file.';
      console.error(`\n❌ ${errorMsg}\n`);
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.warn('⚠️  Continuing without database connection in development mode.');
        console.warn('⚠️  Some features will not work without a database connection.\n');
        return null;
      }
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    await createDefaultAdmin();
    return conn;
  } catch (error) {
    console.error(`❌ DB connection failed (${retries} retries left):`, error.message);
    
    if (retries > 0) {
      console.log(`⏳ Retrying in ${delay/1000} seconds...`);
      setTimeout(() => connectDB(retries - 1, delay), delay);
    } else {
      console.error('\n❌ Could not connect to MongoDB after multiple attempts.');
      console.error('Please check your MONGODB_URI and ensure MongoDB is accessible.\n');
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      } else {
        console.warn('⚠️  Continuing without database connection in development mode.\n');
        return null;
      }
    }
  }
};

const createDefaultAdmin = async () => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      console.warn('⚠️  Database not connected, skipping admin creation');
      return;
    }

    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@swimacademy.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
    
    const exists = await User.findOne({ email: adminEmail });
    
    if (!exists) {
      const hash = await bcrypt.hash(adminPassword, 12);
      await User.create({
        name: 'مدير النظام',
        email: adminEmail,
        password: hash,
        role: 'admin',
        phone: process.env.DEFAULT_ADMIN_PHONE || '+201000000000',
        status: 'active',
        emailVerified: true,
      });
      console.log('✅ تم إنشاء الأدمن الافتراضي');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log('ℹ️  Default admin already exists');
    }
  } catch (err) {
    console.error('❌ Admin creation error:', err.message);
    // Don't crash if admin creation fails
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
  // Log but don't exit in development to allow debugging
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Always exit on uncaught exceptions as they indicate serious issues
  process.exit(1);
});

const startServer = async () => {
  try {
    // Initialize database connection
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    
    // Start HTTP server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`
نظام إدارة أكاديمية السباحة
=================================
السيرفر شغال على: http://localhost:${PORT}
البيئة: ${process.env.NODE_ENV || 'development'}
قاعدة البيانات: MongoDB
=================================
      `);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please use a different port.`);
      } else {
        console.error('Server error:', error);
      }
      process.exit(1);
    });

    // Initialize Socket.IO
    try {
      const { Server } = require('socket.io');
      const io = new Server(server, { 
        cors: { 
          origin: allowedOrigins.length > 0 ? allowedOrigins : '*',
          methods: ['GET', 'POST']
        } 
      });

      io.on('connection', (socket) => {
        socket.on('join-user-room', (userId) => {
          socket.join(`user-${userId}`);
        });
      });

      app.set('io', io);
      global.io = io; // Make io available globally for notifications
      
      console.log('Socket.IO initialized successfully');
    } catch (socketError) {
      console.warn('Socket.IO initialization failed (continuing without it):', socketError.message);
      // Continue without Socket.IO
    }

  } catch (error) {
    console.error('Failed to start server:', error);
    console.error('Error stack:', error.stack);
    
    // In development, don't exit immediately to allow debugging
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.error('Server failed to start. Please check the error above.');
      // Wait a bit before exiting to allow logs to be written
      setTimeout(() => process.exit(1), 2000);
    }
  }
};

// Start server with error handling (skip during tests)
if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('Fatal error during server startup:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    process.exit(1);
  });
}

module.exports = app;
module.exports.startServer = startServer;
module.exports.connectDB = connectDB;