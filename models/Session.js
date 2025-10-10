const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  // المعلومات الأساسية
  title: {
    type: String,
    required: [true, 'عنوان الجلسة مطلوب'],
    trim: true,
    maxlength: [200, 'العنوان لا يمكن أن يزيد عن 200 حرف']
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المدرب مطلوب'],
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المستخدم مطلوب'],
    index: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    index: true
  },

  // التوقيت والمدة
  scheduledDate: {
    type: Date,
    required: [true, 'موعد الجلسة مطلوب'],
    index: true
  },
  duration: {
    type: Number,
    required: [true, 'مدة الجلسة مطلوبة'],
    min: [15, 'المدة يجب أن تكون至少 15 دقيقة'],
    max: [240, 'المدة يجب أن لا تزيد عن 240 دقيقة']
  },
  actualStart: Date,
  actualEnd: Date,
  actualDuration: {
    type: Number,
    min: 0
  },

  // الموقع والنوع
  type: {
    type: String,
    enum: ['swimming', 'fitness', 'rehabilitation', 'technical', 'nutrition', 'consultation'],
    required: true
  },
  location: {
    type: String,
    maxlength: 100
  },
  pool: {
    type: String,
    maxlength: 50
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  meetingLink: String,
  address: {
    street: String,
    city: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  // المحتوى والأهداف
  objectives: [{
    description: {
      type: String,
      required: true
    },
    achieved: {
      type: Boolean,
      default: false
    },
    notes: String
  }],
  exercises: [{
    name: {
      type: String,
      required: true
    },
    sets: Number,
    reps: Number,
    duration: Number,
    weight: Number,
    distance: Number,
    notes: String,
    completed: {
      type: Boolean,
      default: false
    },
    performance: {
      type: Number,
      min: 1,
      max: 10
    }
  }],
  focusAreas: [{
    type: String,
    enum: ['strength', 'endurance', 'technique', 'flexibility', 'speed', 'recovery']
  }],
  equipment: [String],

  // التقدم والأداء
  metrics: {
    distance: { type: Number, min: 0 },
    calories: { type: Number, min: 0 },
    avgHeartRate: { type: Number, min: 0 },
    maxHeartRate: { type: Number, min: 0 },
    effortLevel: { type: Number, min: 1, max: 10 },
    techniqueScore: { type: Number, min: 1, max: 10 },
    consistencyScore: { type: Number, min: 1, max: 10 }
  },
  progress: [{
    exercise: String,
    metric: String,
    value: Number,
    unit: String,
    timestamp: Date
  }],

  // الملاحظات والتقييم
  coachNotes: {
    type: String,
    maxlength: 2000
  },
  userNotes: {
    type: String,
    maxlength: 2000
  },
  achievements: [{
    description: String,
    type: {
      type: String,
      enum: ['personal-best', 'technique-improvement', 'endurance-milestone', 'consistency']
    },
    value: mongoose.Schema.Types.Mixed
  }],
  challenges: [{
    description: String,
    cause: String,
    solution: String,
    resolved: {
      type: Boolean,
      default: false
    }
  }],

  // التقييمات
  ratings: {
    coachRating: {
      score: { type: Number, min: 1, max: 10 },
      comments: String,
      ratedAt: Date
    },
    userRating: {
      score: { type: Number, min: 1, max: 10 },
      comments: String,
      ratedAt: Date
    },
    overallEffectiveness: {
      type: Number,
      min: 1,
      max: 10
    }
  },

  // الحالة والمتابعة
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show', 'rescheduled'],
    default: 'scheduled',
    index: true
  },
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['coach', 'user', 'system']
  },
  rescheduledFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session'
  },
  followUp: {
    required: { type: Boolean, default: false },
    notes: String,
    scheduledDate: Date,
    completed: { type: Boolean, default: false }
  },

  // الإشعارات والتذكيرات
  reminders: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'push'],
      required: true
    },
    sentAt: Date,
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed'],
      default: 'sent'
    }
  }],

  // المرفقات
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    description: String,
    type: {
      type: String,
      enum: ['photo', 'video', 'document', 'chart']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // التحليلات
  analytics: {
    preparationTime: Number,
    cleanupTime: Number,
    engagementScore: { type: Number, min: 1, max: 10 },
    efficiencyScore: { type: Number, min: 1, max: 10 },
    improvementAreas: [String]
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
  completedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
sessionSchema.virtual('isPast').get(function() {
  return this.scheduledDate < new Date();
});

sessionSchema.virtual('isUpcoming').get(function() {
  return this.scheduledDate > new Date();
});

sessionSchema.virtual('timeUntilSession').get(function() {
  return this.scheduledDate - new Date();
});

sessionSchema.virtual('efficiency').get(function() {
  if (!this.actualDuration || !this.duration) return 0;
  return Math.round((this.actualDuration / this.duration) * 100);
});

// Indexes
sessionSchema.index({ coachId: 1, scheduledDate: 1 });
sessionSchema.index({ userId: 1, scheduledDate: 1 });
sessionSchema.index({ subscriptionId: 1, scheduledDate: 1 });
sessionSchema.index({ status: 1, scheduledDate: 1 });
sessionSchema.index({ type: 1, scheduledDate: 1 });
sessionSchema.index({ 'ratings.overallEffectiveness': -1 });

// Middleware
sessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  if (this.actualStart && this.actualEnd) {
    this.actualDuration = Math.round((this.actualEnd - this.actualStart) / (1000 * 60)); // دقائق
  }
  
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Methods
sessionSchema.methods.calculateEngagement = function() {
  let score = 5; // متوسط
  
  if (this.exercises.length > 0) {
    const completedExercises = this.exercises.filter(ex => ex.completed).length;
    const completionRate = completedExercises / this.exercises.length;
    score += completionRate * 3;
  }
  
  if (this.objectives.length > 0) {
    const achievedObjectives = this.objectives.filter(obj => obj.achieved).length;
    const achievementRate = achievedObjectives / this.objectives.length;
    score += achievementRate * 2;
  }
  
  this.analytics.engagementScore = Math.min(Math.max(Math.round(score), 1), 10);
};

sessionSchema.methods.reschedule = function(newDate, reason) {
  this.status = 'rescheduled';
  this.scheduledDate = newDate;
  this.cancellationReason = reason;
};

// Static Methods
sessionSchema.statics.getUpcomingSessions = function(userId, days = 7) {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + days);
  
  return this.find({
    $or: [{ coachId: userId }, { userId: userId }],
    scheduledDate: { $gte: startDate, $lte: endDate },
    status: { $in: ['scheduled', 'confirmed'] }
  })
  .populate('coachId', 'name profileImage specialization')
  .populate('userId', 'name profileImage')
  .sort({ scheduledDate: 1 });
};

sessionSchema.statics.getSessionStats = async function(coachId, period = 'month') {
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
        scheduledDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledSessions: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        totalDuration: { $sum: '$duration' },
        avgRating: { $avg: '$ratings.overallEffectiveness' },
        totalRevenue: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'completed'] },
              { $ifNull: ['$price', 0] },
              0
            ]
          }
        }
      }
    },
    {
      $project: {
        totalSessions: 1,
        completedSessions: 1,
        cancelledSessions: 1,
        completionRate: {
          $round: [
            { $multiply: [{ $divide: ['$completedSessions', '$totalSessions'] }, 100] },
            2
          ]
        },
        totalDuration: 1,
        avgRating: { $round: ['$avgRating', 2] },
        totalRevenue: 1,
        avgSessionDuration: {
          $round: [{ $divide: ['$totalDuration', '$completedSessions'] }, 2]
        }
      }
    }
  ]);
  
  return stats[0] || {};
};

sessionSchema.statics.getBusySlots = async function(coachId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const sessions = await this.find({
    coachId,
    scheduledDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['scheduled', 'confirmed', 'in-progress'] }
  }).select('scheduledDate duration');
  
  return sessions.map(session => ({
    start: session.scheduledDate,
    end: new Date(session.scheduledDate.getTime() + session.duration * 60000)
  }));
};

module.exports = mongoose.model('Session', sessionSchema);