const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // المعلومات الأساسية
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المستخدم مطلوب'],
    index: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المدرب مطلوب'],
    index: true
  },
  planType: {
    type: String,
    enum: ['basic', 'premium', 'vip', 'custom', 'trial'],
    required: true
  },
  planName: {
    type: String,
    required: [true, 'اسم الخطة مطلوب'],
    trim: true,
    maxlength: 100
  },

  // الفترة والتكلفة
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  price: {
    type: Number,
    required: [true, 'السعر مطلوب'],
    min: 0
  },
  currency: {
    type: String,
    default: 'SAR',
    uppercase: true,
    length: 3
  },
  discount: {
    amount: { type: Number, min: 0 },
    percentage: { type: Number, min: 0, max: 100 },
    reason: String,
    appliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  finalPrice: {
    type: Number,
    min: 0,
    required: true
  },

  // الجلسات والحدود
  sessionsPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 14
  },
  totalSessions: {
    type: Number,
    required: true,
    min: 1
  },
  usedSessions: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingSessions: {
    type: Number,
    min: 0
  },
  sessionDuration: {
    type: Number,
    required: true,
    min: 30,
    max: 180,
    default: 60
  },

  // الميزات
  features: {
    progressTracking: { type: Boolean, default: true },
    nutritionPlanning: { type: Boolean, default: false },
    videoSupport: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
    customExercises: { type: Boolean, default: false },
    homeVisits: { type: Boolean, default: false },
    groupSessions: { type: Boolean, default: false }
  },
  limitations: {
    maxReschedules: { type: Number, default: 2 },
    cancellationNotice: { type: Number, default: 24 }, // ساعات
    carryOverSessions: { type: Boolean, default: false },
    maxCarryOver: { type: Number, default: 0 }
  },

  // الدفع والفواتير
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'transfer', 'wallet', 'installments'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_paid'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentGateway: String,
    paidAmount: Number,
    paidAt: Date,
    receiptUrl: String,
    notes: String
  },
  billingCycle: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
    default: 'monthly'
  },
  nextBillingDate: Date,
  autoRenew: {
    type: Boolean,
    default: false
  },

  // الحالة والمتابعة
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled', 'paused', 'pending', 'suspended'],
    default: 'active',
    index: true
  },
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['user', 'coach', 'system', 'admin']
  },
  pausedUntil: Date,
  suspensionReason: String,

  // التجديد والإشعارات
  renewal: {
    autoRenew: { type: Boolean, default: false },
    renewedFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription'
    },
    renewalCount: { type: Number, default: 0 },
    lastRenewalDate: Date
  },
  reminders: {
    expiry: { type: Boolean, default: true },
    sessionLimit: { type: Boolean, default: true },
    payment: { type: Boolean, default: true }
  },

  // التقارير والتحليلات
  analytics: {
    utilizationRate: { type: Number, min: 0, max: 100, default: 0 },
    attendanceRate: { type: Number, min: 0, max: 100, default: 0 },
    satisfactionScore: { type: Number, min: 1, max: 10 },
    valueScore: { type: Number, min: 1, max: 10 },
    progressRate: { type: Number, min: 0, max: 100, default: 0 }
  },

  // الملاحظات
  notes: {
    type: String,
    maxlength: 1000
  },
  coachNotes: {
    type: String,
    maxlength: 1000
  },
  adminNotes: {
    type: String,
    maxlength: 1000
  },

  // المستخدم الذي أنشأ الاشتراك
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // التواريخ
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  cancelledAt: Date,
  expiredAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && this.endDate > new Date();
});

subscriptionSchema.virtual('daysRemaining').get(function() {
  const now = new Date();
  const end = new Date(this.endDate);
  const diffTime = Math.abs(end - now);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

subscriptionSchema.virtual('utilizationPercentage').get(function() {
  return this.totalSessions > 0 ? Math.round((this.usedSessions / this.totalSessions) * 100) : 0;
});

subscriptionSchema.virtual('weeklyUtilization').get(function() {
  const weeks = Math.ceil((new Date() - new Date(this.startDate)) / (7 * 24 * 60 * 60 * 1000));
  return weeks > 0 ? Math.round(this.usedSessions / weeks) : 0;
});

// Indexes
subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ coachId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ planType: 1, status: 1 });
subscriptionSchema.index({ 'paymentStatus': 1, status: 1 });
subscriptionSchema.index({ createdAt: -1 });

// Middleware
subscriptionSchema.pre('validate', function(next) {
  // حساب الجلسات المتبقية
  this.remainingSessions = Math.max(0, this.totalSessions - this.usedSessions);

  // حساب السعر النهائي قبل التحقق من الصحة
  if (this.discount && this.discount.percentage) {
    this.finalPrice = this.price * (1 - this.discount.percentage / 100);
  } else if (this.discount && this.discount.amount) {
    this.finalPrice = Math.max(0, this.price - this.discount.amount);
  } else if (typeof this.price === 'number') {
    this.finalPrice = this.price;
  }

  next();
});

subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // تحديث الحالة تلقائياً
  if (this.status === 'active' && this.endDate < new Date()) {
    this.status = 'expired';
    this.expiredAt = new Date();
  }

  next();
});

// Methods
subscriptionSchema.methods.canBookSession = function() {
  return this.isActive && this.remainingSessions > 0;
};

subscriptionSchema.methods.recordSession = function() {
  if (this.remainingSessions > 0) {
    this.usedSessions += 1;
    this.remainingSessions -= 1;
    
    // تحديث معدل الاستخدام
    this.analytics.utilizationRate = this.utilizationPercentage;
    
    return true;
  }
  return false;
};

subscriptionSchema.methods.renew = function(newEndDate, newPrice = null) {
  this.endDate = newEndDate;
  this.usedSessions = 0;
  this.remainingSessions = this.totalSessions;
  this.status = 'active';
  
  if (newPrice) {
    this.price = newPrice;
    this.finalPrice = newPrice;
  }
  
  this.renewal.renewalCount += 1;
  this.renewal.lastRenewalDate = new Date();
};

subscriptionSchema.methods.calculateValueScore = function() {
  let score = 5; // متوسط
  
  const sessionValue = this.finalPrice / this.totalSessions;
  
  // مقارنة مع متوسط سعر السوق (افتراضي 100 ريال للجلسة)
  const marketAverage = 100;
  if (sessionValue < marketAverage) {
    score += 2;
  } else if (sessionValue > marketAverage * 1.5) {
    score -= 2;
  }
  
  // إضافة نقاط للميزات الإضافية
  const featureCount = Object.values(this.features).filter(Boolean).length;
  score += Math.min(featureCount * 0.5, 3);
  
  this.analytics.valueScore = Math.min(Math.max(Math.round(score), 1), 10);
};

// Static Methods
subscriptionSchema.statics.getActiveSubscriptions = function(userId) {
  return this.find({
    $or: [{ userId }, { coachId: userId }],
    status: 'active',
    endDate: { $gt: new Date() }
  })
  .populate('userId', 'name email phone')
  .populate('coachId', 'name email specialization')
  .sort({ endDate: 1 });
};

subscriptionSchema.statics.getExpiringSubscriptions = function(days = 7) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  
  return this.find({
    status: 'active',
    endDate: { $lte: targetDate, $gte: new Date() }
  })
  .populate('userId', 'name email phone')
  .populate('coachId', 'name email')
  .sort({ endDate: 1 });
};

subscriptionSchema.statics.getRevenueStats = async function(coachId, period = 'month') {
  const startDate = new Date();
  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }
  
  const stats = await this.aggregate([
    {
      $match: {
        coachId: new mongoose.Types.ObjectId(coachId),
        createdAt: { $gte: startDate },
        paymentStatus: 'paid'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$finalPrice' },
        totalSubscriptions: { $sum: 1 },
        avgSubscriptionValue: { $avg: '$finalPrice' },
        byPlan: {
          $push: {
            plan: '$planType',
            revenue: '$finalPrice'
          }
        }
      }
    },
    {
      $project: {
        totalRevenue: 1,
        totalSubscriptions: 1,
        avgSubscriptionValue: { $round: ['$avgSubscriptionValue', 2] },
        planBreakdown: {
          $arrayToObject: {
            $map: {
              input: '$byPlan',
              as: 'item',
              in: {
                k: '$$item.plan',
                v: '$$item.revenue'
              }
            }
          }
        }
      }
    }
  ]);
  
  return stats[0] || {};
};

module.exports = mongoose.model('Subscription', subscriptionSchema);