// config/database.js
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // إنشاء مستخدم أدمن افتراضي
    await createDefaultAdmin();
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

const createDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const existingAdmin = await User.findOne({ email: 'admin@swimacademy.com' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'مدير النظام',
        email: 'admin@swimacademy.com',
        password: hashedPassword,
        role: 'admin',
        phone: '+201000000000',
        status: 'active'
      });
      console.log('✅ تم إنشاء مستخدم الأدمن الافتراضي');
    }
  } catch (error) {
    console.error('❌ خطأ في إنشاء الأدمن الافتراضي:', error);
  }
};

module.exports = connectDB;