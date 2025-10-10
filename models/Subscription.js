// models/Subscription.js
const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planType: {
    type: String,
    enum: ['basic', 'premium', 'vip', 'custom'],
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  renewalDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'pending', 'cancelled'],
    default: 'pending'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  sessionsPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 14
  },
  totalSessions: {
    type: Number,
    required: true
  },
  usedSessions: {
    type: Number,
    default: 0
  },
  remainingSessions: {
    type: Number
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  paymentStatus: {
    type: String,
    enum: ['paid', 'pending', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'wallet'],
    default: 'cash'
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// حساب الجلسات المتبقية قبل الحفظ
subscriptionSchema.pre('save', function(next) {
  this.remainingSessions = this.totalSessions - this.usedSessions;
  this.updatedAt = Date.now();
  
  // تحديث حالة الاشتراك بناءً على التاريخ
  const now = new Date();
  if (this.endDate < now && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// فهرس للمستعلامات السريعة
subscriptionSchema.index({ subscriberId: 1, status: 1 });
subscriptionSchema.index({ endDate: 1 });
subscriptionSchema.index({ renewalDate: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);