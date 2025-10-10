// middleware/errorHandler.js

// 🛡️ معالج الأخطاء المركزي للنظام
const errorHandler = (err, req, res, next) => {
  console.error('🔥 Error Handler:', {
    message: err.message,
    url: req.originalUrl,
    method: req.method,
    user: req.user ? req.user.id : 'غير مسجل'
  });

  let error = { ...err };
  error.message = err.message;

  // 📝 خطأ في التحقق من البيانات (Mongoose Validation)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    const message = `بيانات غير صحيحة: ${messages.join('. ')}`;
    
    return res.status(400).json({
      success: false,
      message: 'بيانات غير صحيحة',
      errors: messages,
      statusCode: 400
    });
  }

  // 🔄 تكرار البيانات (Mongoose Duplicate Key)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    let message = '';
    if (field === 'email') {
      message = `البريد الإلكتروني ${value} مسجل مسبقاً`;
    } else if (field === 'phone') {
      message = `رقم الهاتف ${value} مسجل مسبقاً`;
    } else {
      message = `قيمة ${field} مكررة: ${value}`;
    }

    return res.status(400).json({
      success: false,
      message,
      statusCode: 400
    });
  }

  // 🔐 خطأ في JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'رمز الدخول غير صالح',
      statusCode: 401
    });
  }

  // ⏰ انتهاء صلاحية JWT
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'انتهت صلاحية رمز الدخول. يرجى تسجيل الدخول مرة أخرى',
      statusCode: 401
    });
  }

  // 📁 خطأ في تحميل الملفات (Multer)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'حجم الملف كبير جداً. الحد الأقصى 10MB',
      statusCode: 400
    });
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({
      success: false,
      message: 'تم تجاوز الحد الأقصى لعدد الملفات',
      statusCode: 400
    });
  }

  // 🗄️ خطأ في MongoDB - كائن غير موجود
  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: `المورد غير موجود`,
      statusCode: 404
    });
  }

  // 🔒 خطأ في الصلاحيات
  if (err.message.includes('ليس لديك صلاحية')) {
    return res.status(403).json({
      success: false,
      message: err.message,
      statusCode: 403
    });
  }

  // 📍 خطأ في العثور على المورد
  if (err.message.includes('غير موجود')) {
    return res.status(404).json({
      success: false,
      message: err.message,
      statusCode: 404
    });
  }

  // ⚠️ خطأ عام في الخادم
  const statusCode = err.statusCode || 500;
  const message = err.message || 'حدث خطأ في السيرفر';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message
    }),
    statusCode
  });
};

module.exports = errorHandler;