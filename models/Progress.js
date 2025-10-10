// models/Progress.js
const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'custom'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  // القياسات البدنية
  physicalMeasurements: {
    weight: { 
      type: Number, 
      min: 0,
      set: v => Math.round(v * 100) / 100 // تخزين بمنزلتين عشريتين
    }, // kg
    height: { type: Number, min: 0 }, // cm
    bmi: { 
      type: Number, 
      min: 0,
      set: v => Math.round(v * 10) / 10
    },
    bodyFat: { 
      type: Number, 
      min: 0, 
      max: 100,
      set: v => Math.round(v * 10) / 10
    }, // percentage
    muscleMass: { 
      type: Number, 
      min: 0,
      set: v => Math.round(v * 100) / 100
    }, // kg
    chest: { type: Number, min: 0 }, // cm
    waist: { type: Number, min: 0 }, // cm
    hips: { type: Number, min: 0 }, // cm
    arms: { type: Number, min: 0 }, // cm
    thighs: { type: Number, min: 0 } // cm
  },
  // القياسات الرياضية
  performanceMetrics: {
    swimming: {
      best50m: { type: Number, min: 0 }, // seconds
      best100m: { type: Number, min: 0 }, // seconds
      best200m: { type: Number, min: 0 }, // seconds
      endurance: { type: Number, min: 0 }, // meters without stopping
      techniqueScore: { 
        type: Number, 
        min: 1, 
        max: 10 
      },
      strokesPerLength: { type: Number, min: 0 } // عدد الضربات لكل طول
    },
    fitness: {
      pushups: { type: Number, min: 0 }, // max in one minute
      situps: { type: Number, min: 0 }, // max in one minute
      plank: { type: Number, min: 0 }, // seconds
      squatMax: { type: Number, min: 0 }, // kg
      benchPressMax: { type: Number, min: 0 }, // kg
      deadliftMax: { type: Number, min: 0 }, // kg
      flexibility: { type: Number, min: 0 }, // cm in sit and reach
      verticalJump: { type: Number, min: 0 } // cm
    }
  },
  // الأهداف
  goals: {
    shortTerm: [{
      description: {
        type: String,
        required: true
      },
      targetDate: Date,
      achieved: { 
        type: Boolean, 
        default: false 
      },
      achievedDate: Date,
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }],
    longTerm: [{
      description: {
        type: String,
        required: true
      },
      targetDate: Date,
      achieved: { 
        type: Boolean, 
        default: false 
      },
      achievedDate: Date
    }]
  },
  // التغذية والعادات
  lifestyle: {
    sleepQuality: { 
      type: Number, 
      min: 1, 
      max: 10 
    },
    stressLevel: { 
      type: Number, 
      min: 1, 
      max: 10 
    },
    hydration: { 
      type: Number, 
      min: 1, 
      max: 10 
    },
    nutrition: { 
      type: Number, 
      min: 1, 
      max: 10 
    },
    energyLevel: { 
      type: Number, 
      min: 1, 
      max: 10 
    },
    trainingConsistency: { 
      type: Number, 
      min: 1, 
      max: 10 
    }
  },
  // الملاحظات والتقييم
  notes: {
    type: String,
    maxlength: 2000
  },
  trainerFeedback: {
    type: String,
    maxlength: 1000
  },
  subscriberFeedback: {
    type: String,
    maxlength: 1000
  },
  overallRating: {
    type: Number,
    min: 1,
    max: 10
  },
  recommendations: [{
    area: {
      type: String,
      required: true
    },
    suggestion: {
      type: String,
      required: true
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high'] 
    },
    deadline: Date,
    completed: {
      type: Boolean,
      default: false
    }
  }],
  // المرفقات (صور، فيديوهات، ملفات)
  attachments: [{
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    url: String,
    description: String,
    type: {
      type: String,
      enum: ['photo', 'video', 'document', 'other']
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
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
progressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // حساب BMI تلقائياً إذا كان الوزن والطول متوفرين
  if (this.physicalMeasurements.weight && this.physicalMeasurements.height) {
    const heightInMeters = this.physicalMeasurements.height / 100;
    this.physicalMeasurements.bmi = this.physicalMeasurements.weight / (heightInMeters * heightInMeters);
  }
  
  next();
});

// فهارس للأداء
progressSchema.index({ subscriberId: 1, date: 1 });
progressSchema.index({ trainerId: 1, date: 1 });
progressSchema.index({ type: 1, date: 1 });

// دالة افتراضية للحصول على التقدم النسبي
progressSchema.virtual('progressScore').get(function() {
  let score = 0;
  let factors = 0;

  // قياسات بدنية (40%)
  if (this.physicalMeasurements.bodyFat) {
    score += (100 - this.physicalMeasurements.bodyFat) * 0.4;
    factors++;
  }

  // أداء رياضي (40%)
  if (this.performanceMetrics.swimming?.techniqueScore) {
    score += this.performanceMetrics.swimming.techniqueScore * 4;
    factors++;
  }

  // نمط الحياة (20%)
  if (this.lifestyle.trainingConsistency) {
    score += this.lifestyle.trainingConsistency * 2;
    factors++;
  }

  return factors > 0 ? Math.min(Math.round(score / factors), 100) : 0;
});

// التأكد من أن الحقول الافتراضية تُرجع في JSON
progressSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Progress', progressSchema);