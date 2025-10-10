const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // المعلومات الأساسية
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true,
    maxlength: [100, 'الاسم لا يمكن أن يزيد عن 100 حرف']
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      },
      message: 'البريد الإلكتروني غير صالح'
    }
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [6, 'كلمة المرور يجب أن تكون至少 6 أحرف'],
    select: false
  },
  phone: {
    type: String,
    trim: true,
    validate: {
      validator: function(phone) {
        return !phone || /^[\+]?[1-9][\d]{0,15}$/.test(phone);
      },
      message: 'رقم الهاتف غير صالح'
    }
  },

  // المعلومات الشخصية
  birthDate: {
    type: Date,
    validate: {
      validator: function(date) {
        return !date || date <= new Date();
      },
      message: 'تاريخ الميلاد يجب أن يكون في الماضي'
    }
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    default: 'other'
  },
  profileImage: {
    url: String,
    thumbnail: String,
    uploadedAt: Date
  },

  // الدور والصلاحيات
  role: {
    type: String,
    enum: ['admin', 'coach', 'trainee', 'parent', 'user', 'moderator'],
    default: 'user',
    required: true
  },
  academy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Academy'
  },
  parents: [{
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relation: {
      type: String,
      enum: ['father', 'mother', 'guardian', 'other'],
      default: 'guardian'
    },
    notes: String
  }],
  children: [{
    child: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    relation: {
      type: String,
      enum: ['son', 'daughter', 'dependent', 'other'],
      default: 'dependent'
    },
    notes: String
  }],
  permissions: [{
    module: String,
    actions: [String],
    grantedAt: {
      type: Date,
      default: Date.now
    },
    grantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // التخصص (للمدربين)
  specialization: {
    type: String,
    maxlength: 100
  },
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    verificationUrl: String
  }],
  experience: {
    type: Number,
    min: 0,
    max: 50,
    default: 0
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  hourlyRate: {
    type: Number,
    min: 0
  },
  availability: {
    days: [{
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    }],
    timeSlots: [{
      day: String,
      startTime: String,
      endTime: String
    }]
  },

  // العلاقات (للمستخدمين)
  coaches: [{
    coach: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'ended', 'paused'],
      default: 'active'
    },
    notes: String
  }],
  trainees: [{
    trainee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'ended', 'paused'],
      default: 'active'
    }
  }],

  // حالة الاشتراك الحالية
  hasActiveSubscription: {
    type: Boolean,
    default: false
  },
  currentSubscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    default: null
  },

  // المعلومات الطبية والطوارئ
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
    email: String
  },
  medicalNotes: {
    type: String,
    maxlength: 2000
  },
  allergies: [String],
  medications: [String],
  injuries: [{
    description: String,
    severity: String,
    dateOccurred: Date,
    status: {
      type: String,
      enum: ['active', 'recovered', 'chronic'],
      default: 'active'
    }
  }],

  // الإعدادات
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      reminders: { type: Boolean, default: true },
      progressUpdates: { type: Boolean, default: true }
    },
    privacy: {
      profileVisible: { type: Boolean, default: true },
      progressVisible: { type: Boolean, default: false },
      contactVisible: { type: Boolean, default: false }
    },
    preferences: {
      language: { type: String, default: 'ar' },
      timezone: { type: String, default: 'Asia/Riyadh' },
      measurementSystem: { type: String, enum: ['metric', 'imperial'], default: 'metric' }
    }
  },

  // التحقق والأمان
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  loginAttempts: {
    type: Number,
    default: 0,
    select: false
  },
  lockUntil: {
    type: Date,
    select: false
  },

  // الإحصائيات والتتبع
  analytics: {
    totalSessions: { type: Number, default: 0 },
    completedSessions: { type: Number, default: 0 },
    totalProgressEntries: { type: Number, default: 0 },
    lastActive: Date,
    lastLogin: Date,
    loginCount: { type: Number, default: 0 },
    apiCalls: { type: Number, default: 0 },
    recentActivity: [{
      action: String,
      timestamp: Date,
      details: mongoose.Schema.Types.Mixed
    }]
  },

  // الحالة والنظام
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending', 'deleted'],
    default: 'active'
  },
  suspensionReason: String,
  suspensionUntil: Date,

  // التواريخ المهمة
  lastActive: Date,
  lastPasswordChange: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('fullName').get(function() {
  return this.name;
});

userSchema.virtual('age').get(function() {
  if (!this.birthDate) return null;
  const today = new Date();
  const birthDate = new Date(this.birthDate);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Indexes
// Note: email index is already created by unique: true in schema definition
userSchema.index({ role: 1, status: 1 });
userSchema.index({ academy: 1 });
userSchema.index({ 'coaches.coach': 1 });
userSchema.index({ 'trainees.trainee': 1 });
userSchema.index({ lastActive: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ 'analytics.lastLogin': -1 });

// Middleware
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.isModified('password') && this.password) {
    this.lastPasswordChange = new Date();
  }
  
  next();
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Methods
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.lastPasswordChange) {
    const changedTimestamp = parseInt(this.lastPasswordChange.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  
  return verificationToken;
};

userSchema.methods.incrementLoginAttempts = function() {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
  }
  
  return this.updateOne(updates);
};

// Static Methods
userSchema.statics.getCoaches = function(filters = {}) {
  const query = { role: 'coach', status: 'active', ...filters };
  return this.find(query)
    .select('name email specialization experience bio hourlyRate availability profileImage certifications')
    .sort({ experience: -1, 'analytics.totalSessions': -1 });
};

userSchema.statics.getTrainees = function(coachId, filters = {}) {
  const query = { 
    'coaches.coach': coachId, 
    'coaches.status': 'active',
    status: 'active',
    ...filters 
  };
  
  return this.find(query)
    .select('name email phone birthDate gender medicalNotes lastActive')
    .populate('coaches.coach', 'name specialization')
    .sort({ lastActive: -1 });
};

userSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        active: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        avgExperience: { $avg: '$experience' },
        lastWeek: {
          $sum: {
            $cond: [
              { $gte: ['$createdAt', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        role: '$_id',
        count: 1,
        active: 1,
        inactive: { $subtract: ['$count', '$active'] },
        avgExperience: { $round: ['$avgExperience', 1] },
        lastWeek: 1
      }
    }
  ]);
  
  return stats;
};

// Query Helpers
userSchema.query.active = function() {
  return this.where({ status: 'active' });
};

userSchema.query.byRole = function(role) {
  return this.where({ role });
};

userSchema.query.recentlyActive = function(days = 7) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return this.where('lastActive').gte(date);
};

module.exports = mongoose.model('User', userSchema);