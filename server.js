const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const subscriptionRoutes = require('./routes/subscriptions');
const trainingSessionRoutes = require('./routes/trainingSessions');
const progressRoutes = require('./routes/progress');

const app = express();

const createUploadsFolders = () => {
  const folders = ['avatars', 'progress', 'sessions'];
  folders.forEach(folder => {
    const dir = path.join(__dirname, 'uploads', folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
};
createUploadsFolders();

app.use(cors({
  origin: process.env.CLIENT_URL?.split(',') || [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));

if (process.env.NODE_ENV === 'development') {
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'نظام إدارة أكاديمية السباحة واللياقة البدنية 🏊‍♂️ يعمل بنجاح',
    version: '1.0.0',
    time: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ success: true, status: dbStatus });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/training-sessions', trainingSessionRoutes);
app.use('/api/progress', progressRoutes);

app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: 'المسار غير موجود' });
});

app.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: 'بيانات غير صحيحة', errors });
  }
  if (error.code === 11000)
    return res.status(400).json({ success: false, message: 'البريد الإلكتروني مسجل مسبقاً' });
  if (error.name === 'JsonWebTokenError')
    return res.status(401).json({ success: false, message: 'رمز الدخول غير صالح' });
  res.status(500).json({ success: false, message: 'حدث خطأ في السيرفر' });
});

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swim-academy';
    const conn = await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
    await createDefaultAdmin();
    console.log(`✅ MongoDB: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error('❌ DB connection failed:', error.message);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const exists = await User.findOne({ email: 'admin@swimacademy.com' });
    if (!exists) {
      const hash = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'مدير النظام',
        email: 'admin@swimacademy.com',
        password: hash,
        role: 'admin',
        phone: '+201000000000',
        status: 'active'
      });
      console.log('✅ تم إنشاء الأدمن الافتراضي');
    }
  } catch (err) {
    console.error('❌ Admin creation error:', err.message);
  }
};

const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, '0.0.0.0', () =>
    console.log(`🚀 Server running at http://localhost:${PORT}`)
  );
};

startServer();
module.exports = app;
