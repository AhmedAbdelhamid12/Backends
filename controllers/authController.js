// controllers/authController.js
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// التحقق من صحة البيانات
const validateUserData = (data) => {
  const { name, email, password, role, phone } = data;
  const errors = [];

  if (!name || name.length < 2) {
    errors.push('الاسم يجب أن يكون على الأقل حرفين');
  }

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    errors.push('البريد الإلكتروني غير صحيح');
  }

  if (!password || password.length < 6) {
    errors.push('كلمة المرور يجب أن تكون على الأقل 6 أحرف');
  }

  if (!['admin', 'trainer', 'subscriber', 'parent'].includes(role)) {
    errors.push('الدور المحدد غير صحيح');
  }

  return errors;
};

// إنشاء مستخدم جديد
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;

    // التحقق من البيانات
    const validationErrors = validateUserData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: 'بيانات غير صحيحة',
        errors: validationErrors 
      });
    }

    // التحقق من وجود المستخدم
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: 'البريد الإلكتروني مسجل مسبقاً' 
      });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء المستخدم
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
    });

    // إنشاء التوكن
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      },
    });
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في السيرفر',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // التحقق من البيانات
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' 
      });
    }

    // البحث عن المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'بيانات الدخول غير صحيحة' 
      });
    }

    // التحقق من حالة الحساب
    if (user.status !== 'active') {
      return res.status(401).json({ 
        success: false,
        message: 'الحساب غير نشط. يرجى التواصل مع الإدارة.' 
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'بيانات الدخول غير صحيحة' 
      });
    }

    // إنشاء التوكن
    const token = jwt.sign(
      { 
        userId: user._id, 
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في السيرفر',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// الحصول على بيانات المستخدم الحالي
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب البيانات' 
    });
  }
};