// models/TrainingSession.js
const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  date: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 30,
    max: 180
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['swimming', 'fitness', 'rehabilitation', 'technique', 'endurance'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  // تمارين مفصلة للجلسة
  exercises: [{
    name: {
      type: String,
      required: true
    },
    category: {
      type: String,
      enum: ['warmup', 'technical', 'endurance', 'strength', 'cooldown']
    },
    sets: {
      type: Number,
      min: 1,
      max: 10
    },
    reps: {
      type: String // يمكن أن يكون رقم أو نطاق مثل "8-12"
    },
    weight: {
      type: Number, // بالكيلوجرام
      min: 0
    },
    duration: {
      type: Number, // بالدقائق للتمارين القلبية
      min: 0
    },
    distance: {
      type: Number, // بالأمتار للسباحة
      min: 0
    },
    rest: {
      type: Number, // وقت الراحة بالثواني
      min: 0
    },
    notes: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  // مقاييس التقدم خلال الجلسة
  progressMetrics: {
    distance: { type: Number, min: 0 }, // meters for swimming
    calories: { type: Number, min: 0 },
    heartRate: {
      avg: { type: Number, min: 0 },
      max: { type: Number, min: 0 }
    },
    speed: { type: Number, min: 0 }, // km/h
    techniqueScore: {
      type: Number,
      min: 1,
      max: 10
    },
    effortLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    strokes: {
      type: Number,
      min: 0
    }, // عدد الضربات للسباحة
    laps: {
      type: Number,
      min: 0
    } // عدد اللفات
  },
  // بيانات ما قبل الجلسة
  beforeSession: {
    weight: { type: Number, min: 0 },
    sleepHours: { type: Number, min: 0, max: 24 },
    energyLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    mood: {
      type: String,
      enum: ['excellent', 'good', 'normal', 'tired', 'sick']
    },
    notes: String
  },
  // بيانات ما بعد الجلسة
  afterSession: {
    weight: { type: Number, min: 0 },
    fatigueLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    satisfaction: {
      type: Number,
      min: 1,
      max: 10
    },
    painLevel: {
      type: Number,
      min: 1,
      max: 10
    },
    notes: String
  },
  // المرفقات (صور، فيديوهات، ملفات)
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    description: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // نظام التقييم
  ratings: {
    trainerRating: {
      type: Number,
      min: 1,
      max: 5
    },
    subscriberRating: {
      type: Number,
      min: 1,
      max: 5
    },
    trainerFeedback: String,
    subscriberFeedback: String
  },
  // الإشعارات والتذكيرات
  reminders: {
    sent24h: { type: Boolean, default: false },
    sent1h: { type: Boolean, default: false },
    confirmed: { type: Boolean, default: false }
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

// تحديث updatedAt قبل الحفظ
trainingSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// فهارس للأداء
trainingSessionSchema.index({ trainerId: 1, date: 1 });
trainingSessionSchema.index({ subscriberId: 1, date: 1 });
trainingSessionSchema.index({ date: 1, status: 1 });
trainingSessionSchema.index({ subscriptionId: 1 });

// دالة افتراضية للحصول على العنوان
trainingSessionSchema.virtual('title').get(function() {
  return `${this.type} Session - ${new Date(this.date).toLocaleDateString('ar-EG')}`;
});

// دالة للحصول على المدة المتبقية
trainingSessionSchema.virtual('timeUntilSession').get(function() {
  const now = new Date();
  const sessionTime = new Date(this.date);
  return sessionTime - now;
});

// التأكد من أن الحقول الافتراضية تُرجع في JSON
trainingSessionSchema.set('toJSON', { virtuals: true });

// دوال المثيل
trainingSessionSchema.methods.isUpcoming = function() {
  return this.status === 'scheduled' && new Date(this.date) > new Date();
};

trainingSessionSchema.methods.canBeCancelled = function() {
  const hoursUntilSession = (new Date(this.date) - new Date()) / (1000 * 60 * 60);
  return this.status === 'scheduled' && hoursUntilSession > 2;
};

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);