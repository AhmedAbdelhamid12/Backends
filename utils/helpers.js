// utils/helpers.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/environment');

// إنشاء رمز JWT
exports.generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expire
  });
};

// التحقق من رمز JWT
exports.verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

// تشفير كلمة المرور
exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// مقارنة كلمة المرور
exports.comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// توليد كود عشوائي
exports.generateRandomCode = (length = 6) => {
  const chars = '0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// تنسيق التاريخ
exports.formatDate = (date, format = 'ar-EG') => {
  return new Date(date).toLocaleDateString(format, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// حساب العمر
exports.calculateAge = (birthDate) => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// حساب BMI
exports.calculateBMI = (weight, height) => {
  return (weight / ((height / 100) ** 2)).toFixed(2);
};

// تقييم BMI
exports.getBMICategory = (bmi) => {
  if (bmi < 18.5) return 'نحيف';
  if (bmi < 25) return 'طبيعي';
  if (bmi < 30) return 'زائد الوزن';
  return 'سمين';
};

// تحويل الأدوار للعربية
exports.getArabicRole = (role) => {
  const roles = {
    'admin': 'مدير',
    'trainer': 'مدرب',
    'subscriber': 'مشترك',
    'parent': 'ولي أمر'
  };
  return roles[role] || role;
};

// تحويل حالة الاشتراك للعربية
exports.getArabicSubscriptionStatus = (status) => {
  const statuses = {
    'active': 'نشط',
    'expired': 'منتهي',
    'pending': 'قيد الانتظار',
    'cancelled': 'ملغي'
  };
  return statuses[status] || status;
};

// حساب الوقت المتبقي
exports.getTimeRemaining = (targetDate) => {
  const now = new Date();
  const target = new Date(targetDate);
  const diff = target - now;
  
  if (diff <= 0) return 'منتهي';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} يوم و ${hours} ساعة`;
  return `${hours} ساعة`;
};