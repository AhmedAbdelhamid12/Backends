const mongoose = require('mongoose');

const trainingSessionSchema = new mongoose.Schema({
  // تحديث الأسماء لتتوافق مع الكنترولر
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: {
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
  endTime: {
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
    enum: ['scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  type: {
    type: String,
    enum: ['swimming', 'fitness', 'rehabilitation', 'technique', 'endurance', 'strength', 'other'],
    required: true
  },
  location: {
    type: String,
    required: true
  },
  pool: {
    type: String
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  
  // الحقول من الكنترولر
  exercises: [{
    name: {
      type: String,
      required: true
    },
    sets: Number,
    reps: String,
    duration: Number,
    notes: String,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  objectives: [{
    description: String,
    achieved: {
      type: Boolean,
      default: false
    }
  }],
  
  // الحقول المطلوبة في الكنترولر
  metrics: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  skillsProgress: [{
    skill: String,
    previousLevel: Number,
    currentLevel: Number,
    notes: String
  }],
  coachNotes: String,
  achievements: [String],
  media: [{
    type: String,
    description: String
  }],
  progressNotes: String,
  nextSessionRecommendations: String,
  actualStart: Date,
  actualEnd: Date,
  
  // التقييمات من الكنترولر
  userRating: {
    type: Number,
    min: 1,
    max: 5
  },
  userFeedback: String,
  coachRating: {
    type: Number,
    min: 1,
    max: 5
  },
  coachFeedback: String,
  
  // إعادة الجدولة
  rescheduleReason: String,
  rescheduledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rescheduledAt: Date,
  rescheduleHistory: [{
    from: Date,
    to: Date,
    reason: String,
    rescheduledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    rescheduledAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // التتبع
  progressRecorded: {
    type: Boolean,
    default: false
  },
  progressId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Progress'
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

// الفهارس المطلوبة في الكنترولر
trainingSessionSchema.index({ coachId: 1, date: 1, status: 1 });
trainingSessionSchema.index({ userId: 1, date: 1, status: 1 });
trainingSessionSchema.index({ status: 1, date: 1 });
trainingSessionSchema.index({ pool: 1, date: 1, status: 1 });
trainingSessionSchema.index({ subscriptionId: 1, status: 1 });

// الدوال الافتراضية
trainingSessionSchema.virtual('title').get(function() {
  return `${this.type} Session - ${new Date(this.date).toLocaleDateString('ar-EG')}`;
});

trainingSessionSchema.virtual('timeUntilSession').get(function() {
  const now = new Date();
  const sessionTime = new Date(this.date);
  return sessionTime - now;
});

// دوال المثيل
trainingSessionSchema.methods.isUpcoming = function() {
  return this.status === 'scheduled' && new Date(this.date) > new Date();
};

trainingSessionSchema.methods.canBeCancelled = function() {
  const hoursUntilSession = (new Date(this.date) - new Date()) / (1000 * 60 * 60);
  return this.status === 'scheduled' && hoursUntilSession > 2;
};

// التأكد من أن الحقول الافتراضية تُرجع في JSON
trainingSessionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('TrainingSession', trainingSessionSchema);