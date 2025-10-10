import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import crypto from 'crypto';
import logger from '../utils/logger.js';
import { sendEmail } from '../utils/emailService.js';
import { createNotification } from './notificationController.js';

// تكوينات الأمان
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutTime: 30 * 60 * 1000, // 30 دقيقة
  passwordMinLength: 8,
  tokenExpiration: {
    access: '15m',
    refresh: '7d',
    verification: '24h',
    passwordReset: '1h'
  }
};

// التحقق من صحة البيانات المتقدمة
const validateUserData = (data, isUpdate = false) => {
  const { name, email, password, phone, birthDate } = data;
  const errors = [];

  if (!isUpdate || name !== undefined) {
    if (!name || name.trim().length < 2) {
      errors.push('الاسم يجب أن يكون على الأقل حرفين');
    }
    
    if (name && name.trim().length > 50) {
      errors.push('الاسم يجب ألا يتجاوز 50 حرفاً');
    }
  }

  if (!isUpdate || email !== undefined) {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      errors.push('البريد الإلكتروني غير صحيح');
    }
  }

  if (password && !isUpdate) {
    if (password.length < SECURITY_CONFIG.passwordMinLength) {
      errors.push(`كلمة المرور يجب أن تكون على الأقل ${SECURITY_CONFIG.passwordMinLength} أحرف`);
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام');
    }
  }

  if (phone && !/^\+?[\d\s-()]{10,}$/.test(phone)) {
    errors.push('رقم الهاتف غير صحيح');
  }

  if (birthDate) {
    const birthDateObj = new Date(birthDate);
    const age = Math.floor((new Date() - birthDateObj) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (age < 16) {
      errors.push('يجب أن يكون عمرك 16 سنة على الأقل');
    }
    
    if (age > 100) {
      errors.push('تاريخ الميلاد غير صحيح');
    }
  }

  return errors;
};

// إنشاء التوكن
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      id: user._id, 
      role: user.role,
      email: user.email,
      type: 'access'
    },
    process.env.JWT_SECRET,
    { expiresIn: SECURITY_CONFIG.tokenExpiration.access }
  );

  const refreshToken = jwt.sign(
    { 
      id: user._id, 
      type: 'refresh'
    },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: SECURITY_CONFIG.tokenExpiration.refresh }
  );

  return { accessToken, refreshToken };
};

// التحقق من محاولات الدخول
const checkLoginAttempts = async (user) => {
  const now = new Date();
  const lockoutTime = new Date(now.getTime() - SECURITY_CONFIG.lockoutTime);

  if (user.loginAttempts >= SECURITY_CONFIG.maxLoginAttempts && 
      user.lockUntil > lockoutTime) {
    const remainingTime = Math.ceil((user.lockUntil - now) / (60 * 1000));
    throw new Error(`الحساب مغلق مؤقتاً. يرجى المحاولة بعد ${remainingTime} دقيقة`);
  }
};

// تحديث محاولات الدخول
const updateLoginAttempts = async (user, success) => {
  if (success) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = new Date();
  } else {
    user.loginAttempts += 1;
    
    if (user.loginAttempts >= SECURITY_CONFIG.maxLoginAttempts) {
      user.lockUntil = new Date(Date.now() + SECURITY_CONFIG.lockoutTime);
    }
  }
  
  await user.save();
};

// إنشاء مستخدم جديد مع تحسينات
export const register = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      phone, 
      birthDate,
      gender,
      emergencyContact,
      medicalNotes,
      role = 'user' 
    } = req.body;

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
    const existingUser = await User.findOne({ 
      $or: [
        { email },
        { phone }
      ]
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'البريد الإلكتروني' : 'رقم الهاتف';
      return res.status(400).json({ 
        success: false,
        message: `${field} مسجل مسبقاً` 
      });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12);

    // إنشاء رمز التحقق
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 ساعة

    // إنشاء المستخدم
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      phone,
      birthDate: birthDate ? new Date(birthDate) : undefined,
      gender,
      emergencyContact,
      medicalNotes,
      provider: 'local',
      emailVerificationToken,
      emailVerificationExpires,
      status: 'pending' // ينتظر التحقق من البريد
    });

    // إرسال بريد التحقق
    try {
      await sendVerificationEmail(user, emailVerificationToken);
    } catch (emailError) {
      logger.error('Failed to send verification email:', emailError);
      // نستمر في العملية حتى لو فشل إرسال البريد
    }

    // إنشاء التوكن
    const { accessToken, refreshToken } = generateTokens(user);

    logger.info(`New user registered: ${email}`, {
      userId: user._id,
      role: user.role
    });

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          status: user.status,
          provider: user.provider,
          emailVerified: user.emailVerified
        }
      }
    });
  } catch (error) {
    logger.error('Register Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false,
        message: 'البريد الإلكتروني أو رقم الهاتف مسجل مسبقاً' 
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'خطأ في إنشاء الحساب',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// تسجيل الدخول مع تحسينات الأمان
export const login = async (req, res, next) => {
  passport.authenticate('local', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        logger.error('Login authentication error:', err);
        return next(err);
      }
      
      if (!user) {
        return res.status(401).json({ 
          success: false,
          message: info?.message || 'بيانات الدخول غير صحيحة' 
        });
      }

      // التحقق من حالة الحساب
      if (user.status !== 'active') {
        if (user.status === 'suspended') {
          return res.status(403).json({
            success: false,
            message: 'الحساب موقوف. يرجى التواصل مع الدعم'
          });
        }
        
        if (user.status === 'pending') {
          return res.status(403).json({
            success: false,
            message: 'الحساب ينتظر التحقق. يرجى التحقق من بريدك الإلكتروني'
          });
        }
      }

      // التحقق من محاولات الدخول
      try {
        await checkLoginAttempts(user);
      } catch (lockError) {
        return res.status(423).json({
          success: false,
          message: lockError.message
        });
      }

      // التحقق من كلمة المرور
      const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
      
      if (!isPasswordValid) {
        await updateLoginAttempts(user, false);
        
        const remainingAttempts = SECURITY_CONFIG.maxLoginAttempts - user.loginAttempts;
        return res.status(401).json({
          success: false,
          message: `بيانات الدخول غير صحيحة. لديك ${remainingAttempts} محاولات متبقية`,
          remainingAttempts
        });
      }

      // تحديث محاولات الدخول بنجاح
      await updateLoginAttempts(user, true);

      // إنشاء التوكن
      const { accessToken, refreshToken } = generateTokens(user);

      // تحديث آخر دخول
      user.lastLogin = new Date();
      user.lastActive = new Date();
      await user.save();

      // تسجيل دخول ناجح
      logger.info(`User logged in successfully: ${user.email}`, {
        userId: user._id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        message: 'تم تسجيل الدخول بنجاح',
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
            status: user.status,
            avatar: user.avatar,
            provider: user.provider,
            emailVerified: user.emailVerified,
            lastLogin: user.lastLogin
          }
        }
      });
    } catch (error) {
      logger.error('Login process error:', error);
      res.status(500).json({ 
        success: false,
        message: 'خطأ في عملية الدخول'
      });
    }
  })(req, res, next);
};

// تجديد التوكن
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحديث مطلوب'
      });
    }

    // التحقق من التوكن
    const decoded = jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      return res.status(400).json({
        success: false,
        message: 'نوع التوكن غير صحيح'
      });
    }

    // البحث عن المستخدم
    const user = await User.findById(decoded.id);
    if (!user || user.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود أو غير نشط'
      });
    }

    // إنشاء توكن جديد
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    res.json({
      success: true,
      message: 'تم تجديد التوكن بنجاح',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية رمز التحديث'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'رمز التحديث غير صالح'
      });
    }

    logger.error('Refresh Token Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تجديد التوكن'
    });
  }
};

// التحقق من البريد الإلكتروني
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحقق مطلوب'
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحقق غير صالح أو منتهي الصلاحية'
      });
    }

    // تحديث حالة المستخدم
    user.emailVerified = true;
    user.status = 'active';
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.emailVerifiedAt = new Date();
    await user.save();

    // إرسال إشعار
    await createNotification(
      user._id,
      'تم التحقق من البريد الإلكتروني',
      'تم التحقق من بريدك الإلكتروني بنجاح. يمكنك الآن استخدام جميع مزايا التطبيق.',
      {
        type: 'success',
        category: 'account',
        actionUrl: '/profile'
      }
    );

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
      success: true,
      message: 'تم التحقق من البريد الإلكتروني بنجاح'
    });
  } catch (error) {
    logger.error('Verify Email Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في التحقق من البريد الإلكتروني'
    });
  }
};

// إعادة إرسال بريد التحقق
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مطلوب'
      });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      // عدم الكشف عن وجود المستخدم
      return res.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجل، ستصلك رسالة التحقق'
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مفعل بالفعل'
      });
    }

    // إنشاء رمز تحقق جديد
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = emailVerificationExpires;
    await user.save();

    // إرسال البريد
    await sendVerificationEmail(user, emailVerificationToken);

    logger.info(`Verification email resent to: ${email}`);

    res.json({
      success: true,
      message: 'تم إرسال رسالة التحقق إلى بريدك الإلكتروني'
    });
  } catch (error) {
    logger.error('Resend Verification Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة إرسال رسالة التحقق'
    });
  }
};

// تسجيل الدخول بـ Google مع تحسينات
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false
});

// رد استدعاء Google محسن
export const googleCallback = (req, res, next) => {
  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err) {
        logger.error('Google OAuth callback error:', err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=user_not_found`);
      }

      // التحقق من حالة الحساب
      if (user.status !== 'active') {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=account_inactive`);
      }

      // إنشاء التوكن
      const { accessToken, refreshToken } = generateTokens(user);

      // تحديث آخر دخول
      user.lastLogin = new Date();
      user.lastActive = new Date();
      await user.save();

      logger.info(`User logged in via Google: ${user.email}`);

      // إعادة التوجيه مع التوكن
      const redirectUrl = `${process.env.CLIENT_URL}/auth/success?access_token=${accessToken}&refresh_token=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Google callback process error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
  })(req, res, next);
};

// تسجيل الدخول بـ Facebook
export const facebookAuth = passport.authenticate('facebook', {
  scope: ['email'],
  session: false
});

export const facebookCallback = (req, res, next) => {
  passport.authenticate('facebook', { session: false }, async (err, user) => {
    try {
      if (err) {
        logger.error('Facebook OAuth callback error:', err);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
      }

      if (!user) {
        return res.redirect(`${process.env.CLIENT_URL}/login?error=user_not_found`);
      }

      const { accessToken, refreshToken } = generateTokens(user);

      user.lastLogin = new Date();
      user.lastActive = new Date();
      await user.save();

      logger.info(`User logged in via Facebook: ${user.email}`);

      const redirectUrl = `${process.env.CLIENT_URL}/auth/success?access_token=${accessToken}&refresh_token=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('Facebook callback process error:', error);
      res.redirect(`${process.env.CLIENT_URL}/login?error=server_error`);
    }
  })(req, res, next);
};

// الحصول على بيانات المستخدم الحالي مع تفاصيل إضافية
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -emailVerificationToken')
      .populate('subscription', 'planName status endDate')
      .populate('coaches', 'name email specialization avatar');
    
    // تحديث آخر نشاط
    user.lastActive = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          avatar: user.avatar,
          status: user.status,
          provider: user.provider,
          emailVerified: user.emailVerified,
          lastLogin: user.lastLogin,
          lastActive: user.lastActive,
          birthDate: user.birthDate,
          gender: user.gender,
          emergencyContact: user.emergencyContact,
          medicalNotes: user.medicalNotes,
          subscription: user.subscription,
          coaches: user.coaches,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    logger.error('GetMe Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في جلب البيانات' 
    });
  }
};

// تحديث الملف الشخصي مع تحسينات
export const updateProfile = async (req, res) => {
  try {
    const { 
      name, 
      phone, 
      avatar, 
      birthDate, 
      gender, 
      emergencyContact, 
      medicalNotes 
    } = req.body;
    
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone;
    if (avatar) updateData.avatar = avatar;
    if (birthDate) updateData.birthDate = new Date(birthDate);
    if (gender) updateData.gender = gender;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (medicalNotes) updateData.medicalNotes = medicalNotes;

    // التحقق من البيانات
    const validationErrors = validateUserData(updateData, true);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors: validationErrors
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -emailVerificationToken');

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
      success: true,
      message: 'تم تحديث الملف الشخصي بنجاح',
      data: { user }
    });
  } catch (error) {
    logger.error('Update Profile Error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'رقم الهاتف مسجل مسبقاً'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'خطأ في تحديث الملف الشخصي'
    });
  }
};

// تغيير كلمة المرور مع تحسينات الأمان
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال كلمة المرور الحالية والجديدة'
      });
    }

    // التحقق من قوة كلمة المرور الجديدة
    const passwordErrors = [];
    if (newPassword.length < SECURITY_CONFIG.passwordMinLength) {
      passwordErrors.push(`كلمة المرور يجب أن تكون على الأقل ${SECURITY_CONFIG.passwordMinLength} أحرف`);
    }
    
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      passwordErrors.push('كلمة المرور يجب أن تحتوي على حروف كبيرة وصغيرة وأرقام');
    }
    
    if (passwordErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة غير آمنة',
        errors: passwordErrors
      });
    }

    const user = await User.findById(userId).select('+password');
    
    if (user.provider !== 'local') {
      return res.status(400).json({
        success: false,
        message: `لا يمكن تغيير كلمة المرور لحساب ${user.provider}`
      });
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    // التحقق من عدم استخدام كلمة المرور القديمة
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية'
      });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    // إرسال إشعار تغيير كلمة المرور
    await createNotification(
      userId,
      'تم تغيير كلمة المرور',
      'تم تغيير كلمة مرور حسابك بنجاح.',
      {
        type: 'security',
        category: 'account'
      }
    );

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });
  } catch (error) {
    logger.error('Change Password Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في تغيير كلمة المرور'
    });
  }
};

// طلب إعادة تعيين كلمة المرور مع تحسينات
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال البريد الإلكتروني'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // عدم الكشف عن وجود المستخدم لأسباب أمنية
      return res.json({
        success: true,
        message: 'إذا كان البريد الإلكتروني مسجل، ستصلك رسالة إعادة التعيين'
      });
    }

    if (user.provider !== 'local') {
      return res.status(400).json({
        success: false,
        message: `لا يمكن إعادة تعيين كلمة المرور لحساب ${user.provider}`
      });
    }

    // إنشاء توكن إعادة التعيين
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // ساعة واحدة

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // إرسال بريد إعادة التعيين
    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'خطأ في إرسال بريد إعادة التعيين'
      });
    }

    logger.info(`Password reset requested for: ${email}`);

    res.json({
      success: true,
      message: 'تم إرسال تعليمات إعادة التعيين إلى بريدك الإلكتروني'
    });
  } catch (error) {
    logger.error('Forgot Password Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في معالجة الطلب'
    });
  }
};

// إعادة تعيين كلمة المرور مع تحسينات
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال التوكن وكلمة المرور الجديدة'
      });
    }

    // التحقق من قوة كلمة المرور
    if (newPassword.length < SECURITY_CONFIG.passwordMinLength) {
      return res.status(400).json({
        success: false,
        message: `كلمة المرور يجب أن تكون على الأقل ${SECURITY_CONFIG.passwordMinLength} أحرف`
      });
    }

    // البحث عن المستخدم بالتوكن
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'توكن إعادة التعيين غير صالح أو منتهي الصلاحية'
      });
    }

    // تحديث كلمة المرور
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.passwordChangedAt = new Date();
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // إرسال إشعار تغيير كلمة المرور
    await createNotification(
      user._id,
      'تم إعادة تعيين كلمة المرور',
      'تم إعادة تعيين كلمة مرور حسابك بنجاح.',
      {
        type: 'security',
        category: 'account'
      }
    );

    logger.info(`Password reset successfully for: ${user.email}`);

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح'
    });
  } catch (error) {
    logger.error('Reset Password Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'خطأ في إعادة تعيين كلمة المرور'
    });
  }
};

// تسجيل الخروج مع إدارة الجلسات
export const logout = async (req, res) => {
  try {
    // في تطبيق حقيقي، يمكنك إضافة التوكن إلى القائمة السوداء
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      // هنا يمكن إضافة التوكن إلى Redis أو قاعدة بيانات للقائمة السوداء
      logger.info(`User logged out: ${req.user.email}`, {
        userId: req.user._id,
        token: token.substring(0, 10) + '...' // تسجيل جزء من التوكن فقط
      });
    }

    res.json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    logger.error('Logout Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الخروج'
    });
  }
};

// حذف الحساب
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user._id;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'يرجى إدخال كلمة المرور للتأكيد'
      });
    }

    const user = await User.findById(userId).select('+password');
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور غير صحيحة'
      });
    }

    // بدلاً من الحذف الفعلي، نقوم بتعطيل الحساب
    user.status = 'deleted';
    user.email = `deleted_${user._id}@deleted.com`;
    user.phone = null;
    user.name = 'مستخدم محذوف';
    user.avatar = null;
    await user.save();

    logger.info(`Account deleted: ${user._id}`);

    res.json({
      success: true,
      message: 'تم حذف الحساب بنجاح'
    });
  } catch (error) {
    logger.error('Delete Account Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الحساب'
    });
  }
};

// دوال مساعدة

// إرسال بريد التحقق
const sendVerificationEmail = async (user, token) => {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  
  const emailData = {
    to: user.email,
    subject: 'تحقق من بريدك الإلكتروني',
    template: 'email-verification',
    context: {
      name: user.name,
      verificationUrl,
      supportEmail: process.env.SUPPORT_EMAIL
    }
  };

  await sendEmail(emailData);
};

// إرسال بريد إعادة تعيين كلمة المرور
const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  
  const emailData = {
    to: user.email,
    subject: 'إعادة تعيين كلمة المرور',
    template: 'password-reset',
    context: {
      name: user.name,
      resetUrl,
      expiryTime: '60 دقيقة'
    }
  };

  await sendEmail(emailData);
};

export default {
  register,
  login,
  refreshToken,
  verifyEmail,
  resendVerification,
  googleAuth,
  googleCallback,
  facebookAuth,
  facebookCallback,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  logout,
  deleteAccount
};