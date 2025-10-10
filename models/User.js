// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true,
    minlength: [2, 'الاسم يجب أن يكون على الأقل حرفين'],
    maxlength: [50, 'الاسم لا يمكن أن يزيد عن 50 حرف']
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'البريد الإلكتروني غير صحيح']
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [6, 'كلمة المرور يجب أن تكون على الأقل 6 أحرف']
  },
  role: {
    type: String,
    enum: {
      values: ['admin', 'trainer', 'subscriber', 'parent'],
      message: 'الدور {VALUE} غير مدعوم'
    },
    required: [true, 'الدور مطلوب']
  },
  phone: {
    type: String,
    trim: true
  },
  avatar: {
    type: String,
    default: 'default-avatar.png'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  // حقول إضافية للمدربين - غير مطلوبة في التسجيل
  specialization: {
    type: String,
    required: false // غير مطلوب في التسجيل
  },
  experience: {
    type: Number, // عدد سنوات الخبرة
    required: false // غير مطلوب في التسجيل
  },
  bio: {
    type: String,
    maxlength: 500
  },
  // حقول إضافية للمشتركين
  birthDate: Date,
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  medicalNotes: String,
  // علاقة ولي الأمر مع المشتركين (للوالدين)
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // علاقة المدرب مع المشتركين
  trainees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// تحديث updatedAt قبل الحفظ
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// دالة لمقارنة كلمة المرور
userSchema.methods.comparePassword = async function(candidatePassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(candidatePassword, this.password);
};

// دالة لتحويل المستخدم إلى JSON بدون كلمة المرور
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);