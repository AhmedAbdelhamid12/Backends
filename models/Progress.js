const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  // المستخدم (دعم كلا الاسمين للتوافق مع الكود القديم)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  // الجلسة المرتبطة
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingSession',
    index: true
  },
  // المدرب (اختياري - يمكن استخراجه من الجلسة)
  trainerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  type: {
    type: String,
    enum: ['training', 'measurement', 'assessment', 'milestone', 'weekly', 'monthly', 'quarterly', 'custom', 'initial', 'final'],
    required: true,
    default: 'training'
  },
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  phase: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'maintenance'],
    default: 'beginner'
  },
  
  physicalMeasurements: {
    weight: { 
      type: Number, 
      min: 0,
      set: v => v ? Math.round(v * 100) / 100 : v
    },
    height: { type: Number, min: 0 },
    bmi: { 
      type: Number, 
      min: 0,
      set: v => v ? Math.round(v * 10) / 10 : v
    },
    bodyFat: { 
      type: Number, 
      min: 0, 
      max: 100,
      set: v => v ? Math.round(v * 10) / 10 : v
    },
    muscleMass: { 
      type: Number, 
      min: 0,
      set: v => v ? Math.round(v * 100) / 100 : v
    },
    chest: { type: Number, min: 0 },
    waist: { type: Number, min: 0 },
    hips: { type: Number, min: 0 },
    arms: { type: Number, min: 0 },
    thighs: { type: Number, min: 0 },
    neck: { type: Number, min: 0 },
    shoulders: { type: Number, min: 0 }
  },

  performanceMetrics: {
    swimming: {
      best50m: { type: Number, min: 0 },
      best100m: { type: Number, min: 0 },
      best200m: { type: Number, min: 0 },
      best400m: { type: Number, min: 0 },
      endurance: { type: Number, min: 0 },
      techniqueScore: { 
        type: Number, 
        min: 1, 
        max: 10 
      },
      strokesPerLength: { type: Number, min: 0 },
      breathingEfficiency: { type: Number, min: 1, max: 10 },
      turnEfficiency: { type: Number, min: 1, max: 10 }
    },
    fitness: {
      pushups: { type: Number, min: 0 },
      situps: { type: Number, min: 0 },
      pullups: { type: Number, min: 0 },
      plank: { type: Number, min: 0 },
      squatMax: { type: Number, min: 0 },
      benchPressMax: { type: Number, min: 0 },
      deadliftMax: { type: Number, min: 0 },
      flexibility: { type: Number, min: 0 },
      verticalJump: { type: Number, min: 0 },
      agility: { type: Number, min: 0 },
      balance: { type: Number, min: 1, max: 10 }
    },
    stamina: {
      restingHeartRate: { type: Number, min: 0 },
      maxHeartRate: { type: Number, min: 0 },
      recoveryRate: { type: Number, min: 0 },
      vo2max: { type: Number, min: 0 }
    }
  },

  goals: {
    shortTerm: [{
      description: {
        type: String,
        required: true,
        trim: true
      },
      category: {
        type: String,
        enum: ['fitness', 'swimming', 'nutrition', 'lifestyle', 'technical'],
        default: 'fitness'
      },
      targetValue: mongoose.Schema.Types.Mixed,
      currentValue: mongoose.Schema.Types.Mixed,
      unit: String,
      targetDate: {
        type: Date,
        required: true
      },
      achieved: { 
        type: Boolean, 
        default: false 
      },
      achievedDate: Date,
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'medium'
      },
      difficulty: {
        type: String,
        enum: ['easy', 'moderate', 'challenging', 'expert'],
        default: 'moderate'
      }
    }],
    longTerm: [{
      description: {
        type: String,
        required: true,
        trim: true
      },
      category: {
        type: String,
        enum: ['fitness', 'swimming', 'nutrition', 'lifestyle', 'technical', 'competition'],
        default: 'fitness'
      },
      targetValue: mongoose.Schema.Types.Mixed,
      currentValue: mongoose.Schema.Types.Mixed,
      unit: String,
      targetDate: {
        type: Date,
        required: true
      },
      achieved: { 
        type: Boolean, 
        default: false 
      },
      achievedDate: Date,
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      milestone: [{
        description: String,
        targetDate: Date,
        achieved: Boolean
      }]
    }]
  },

  lifestyle: {
    sleep: {
      quality: { type: Number, min: 1, max: 10 },
      duration: { type: Number, min: 0, max: 24 },
      consistency: { type: Number, min: 1, max: 10 }
    },
    nutrition: {
      quality: { type: Number, min: 1, max: 10 },
      hydration: { type: Number, min: 1, max: 10 },
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 },
      fats: { type: Number, min: 0 }
    },
    stress: {
      level: { type: Number, min: 1, max: 10 },
      management: { type: Number, min: 1, max: 10 }
    },
    recovery: {
      quality: { type: Number, min: 1, max: 10 },
      activeRecovery: { type: Number, min: 1, max: 10 }
    },
    motivation: {
      level: { type: Number, min: 1, max: 10 },
      consistency: { type: Number, min: 1, max: 10 }
    }
  },

  skills: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['swimming_technique', 'fitness', 'nutrition', 'recovery', 'mental'],
      required: true
    },
    proficiency: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    targetProficiency: {
      type: Number,
      min: 1,
      max: 10
    },
    notes: String,
    lastPracticed: Date,
    improvement: {
      type: Number,
      min: -10,
      max: 10,
      default: 0
    }
  }],

  injuries: [{
    description: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true
    },
    affectedArea: String,
    dateOccurred: Date,
    dateHealed: Date,
    restrictions: [String],
    treatment: String,
    status: {
      type: String,
      enum: ['active', 'healing', 'resolved'],
      default: 'active'
    }
  }],

  // المقاييس (دعم البنية البسيطة من الكنترولر)
  metrics: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // حساب التحسن
  improvement: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // المهارات (دعم البنية البسيطة)
  skills: [{
    skill: String,
    proficiency: { type: Number, min: 1, max: 10 },
    notes: String,
    coachNotes: String,
    category: String,
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    addedAt: { type: Date, default: Date.now },
    improvement: Number,
    previousProficiency: Number
  }],
  // الملاحظات
  notes: {
    type: String,
    maxlength: 5000,
    trim: true
  },
  coachFeedback: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  trainerFeedback: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  subscriberFeedback: {
    type: String,
    maxlength: 2000,
    trim: true
  },
  // التقييم الذاتي
  selfRating: {
    type: Number,
    min: 1,
    max: 10
  },
  // الأهداف
  objectives: [String],
  // الوسوم
  tags: [String],
  // الموقع
  location: String,
  // المدة
  duration: Number,
  // الشدة
  intensity: {
    type: Number,
    min: 1,
    max: 10
  },
  // الوسائط (دعم البنية البسيطة)
  media: [{
    type: { type: String, enum: ['photo', 'video', 'document', 'scan'] },
    url: String,
    thumbnail: String,
    description: String,
    category: { type: String, default: 'general' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now }
  }],
  // الحالة
  status: {
    type: String,
    enum: ['pending', 'completed', 'draft'],
    default: 'completed'
  },
  // من قام بالإنشاء
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // من قام بالتحديث
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  ratings: {
    overall: {
      type: Number,
      min: 1,
      max: 10
    },
    effort: {
      type: Number,
      min: 1,
      max: 10
    },
    consistency: {
      type: Number,
      min: 1,
      max: 10
    },
    technique: {
      type: Number,
      min: 1,
      max: 10
    },
    progress: {
      type: Number,
      min: 1,
      max: 10
    }
  },

  recommendations: [{
    area: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['training', 'nutrition', 'recovery', 'technique', 'lifestyle'],
      required: true
    },
    suggestion: {
      type: String,
      required: true,
      trim: true
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    deadline: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    impact: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],

  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    description: {
      type: String,
      maxlength: 500
    },
    type: {
      type: String,
      enum: ['photo', 'video', 'document', 'chart', 'other'],
      default: 'photo'
    },
    category: {
      type: String,
      enum: ['measurement', 'performance', 'technique', 'nutrition', 'other'],
      default: 'measurement'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    isPublic: {
      type: Boolean,
      default: false
    }
  }],

  analytics: {
    progressScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    improvementRate: {
      type: Number,
      default: 0
    },
    consistencyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    goalCompletionRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    riskFactors: [{
      factor: String,
      level: {
        type: String,
        enum: ['low', 'medium', 'high']
      },
      notes: String
    }]
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
  },
  nextAssessment: {
    type: Date
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

progressSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // دعم التوافق مع الكود القديم - إذا كان subscriberId موجود ولكن userId غير موجود
  if (!this.userId && this.subscriberId) {
    this.userId = this.subscriberId;
  }
  // والعكس - إذا كان userId موجود ولكن subscriberId غير موجود
  if (!this.subscriberId && this.userId) {
    this.subscriberId = this.userId;
  }
  
  // حساب BMI إذا كانت البيانات متوفرة
  if (this.physicalMeasurements && this.physicalMeasurements.weight && this.physicalMeasurements.height) {
    const heightInMeters = this.physicalMeasurements.height / 100;
    this.physicalMeasurements.bmi = this.physicalMeasurements.weight / (heightInMeters * heightInMeters);
  }
  
  // حساب نقاط التقدم إذا كانت البيانات متوفرة
  if (this.physicalMeasurements || this.performanceMetrics) {
    this.calculateProgressScore();
    this.calculateImprovementRate();
  }
  
  // تحديث تقدم الأهداف إذا كانت موجودة
  if (this.goals && (this.goals.shortTerm || this.goals.longTerm)) {
    this.updateGoalProgress();
  }
  
  next();
});

progressSchema.methods.calculateProgressScore = function() {
  let score = 0;
  let factors = 0;
  let totalWeight = 0;

  const weights = {
    physical: 0.3,
    performance: 0.4,
    lifestyle: 0.2,
    goals: 0.1
  };

  if (this.physicalMeasurements.bodyFat) {
    score += (100 - this.physicalMeasurements.bodyFat) * weights.physical;
    factors += weights.physical;
  }

  if (this.performanceMetrics.swimming?.techniqueScore) {
    score += this.performanceMetrics.swimming.techniqueScore * 10 * weights.performance;
    factors += weights.performance;
  }

  if (this.performanceMetrics.fitness) {
    const fitnessScore = this.calculateFitnessScore();
    score += fitnessScore * weights.performance;
    factors += weights.performance;
  }

  if (this.lifestyle.sleep?.quality) {
    score += this.lifestyle.sleep.quality * 10 * weights.lifestyle;
    factors += weights.lifestyle;
  }

  if (this.lifestyle.nutrition?.quality) {
    score += this.lifestyle.nutrition.quality * 10 * weights.lifestyle;
    factors += weights.lifestyle;
  }

  const goalProgress = this.calculateGoalProgress();
  score += goalProgress * weights.goals;
  factors += weights.goals;

  this.analytics.progressScore = factors > 0 ? Math.min(Math.round(score / factors), 100) : 0;
};

progressSchema.methods.calculateFitnessScore = function() {
  let fitnessScore = 0;
  let fitnessFactors = 0;

  const metrics = this.performanceMetrics.fitness;
  
  if (metrics.pushups) {
    fitnessScore += Math.min(metrics.pushups / 50 * 100, 100);
    fitnessFactors++;
  }
  
  if (metrics.plank) {
    fitnessScore += Math.min(metrics.plank / 300 * 100, 100);
    fitnessFactors++;
  }
  
  if (metrics.flexibility) {
    fitnessScore += Math.min(metrics.flexibility / 40 * 100, 100);
    fitnessFactors++;
  }

  return fitnessFactors > 0 ? fitnessScore / fitnessFactors : 0;
};

progressSchema.methods.calculateGoalProgress = function() {
  let totalProgress = 0;
  let totalGoals = 0;

  [...this.goals.shortTerm, ...this.goals.longTerm].forEach(goal => {
    if (goal.progress !== undefined) {
      totalProgress += goal.progress;
      totalGoals++;
    } else {
      totalProgress += goal.achieved ? 100 : 0;
      totalGoals++;
    }
  });

  return totalGoals > 0 ? totalProgress / totalGoals : 0;
};

progressSchema.methods.calculateImprovementRate = function() {
  this.analytics.goalCompletionRate = this.calculateGoalProgress();
};

progressSchema.methods.updateGoalProgress = function() {
  this.goals.shortTerm.forEach(goal => {
    if (goal.currentValue !== undefined && goal.targetValue !== undefined) {
      const progress = (goal.currentValue / goal.targetValue) * 100;
      goal.progress = Math.min(Math.max(Math.round(progress), 0), 100);
      goal.achieved = goal.progress >= 100;
      if (goal.achieved && !goal.achievedDate) {
        goal.achievedDate = new Date();
      }
    }
  });

  this.goals.longTerm.forEach(goal => {
    if (goal.currentValue !== undefined && goal.targetValue !== undefined) {
      const progress = (goal.currentValue / goal.targetValue) * 100;
      goal.progress = Math.min(Math.max(Math.round(progress), 0), 100);
      goal.achieved = goal.progress >= 100;
      if (goal.achieved && !goal.achievedDate) {
        goal.achievedDate = new Date();
      }
    }
  });
};

progressSchema.virtual('progressLevel').get(function() {
  const score = this.analytics.progressScore;
  if (score >= 90) return 'excellent';
  if (score >= 75) return 'very-good';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  return 'needs-improvement';
});

progressSchema.virtual('daysSinceStart').get(function() {
  const userId = this.userId || this.subscriberId;
  if (!userId) return 0;
  
  // هذا virtual غير async - يجب استخدام static method بدلاً من ذلك
  return null;
});

progressSchema.statics.getProgressTrend = async function(userId, period = '30d') {
  const days = period === '30d' ? 30 : period === '90d' ? 90 : 7;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    {
      $match: {
        $or: [
          { userId: new mongoose.Types.ObjectId(userId) },
          { subscriberId: new mongoose.Types.ObjectId(userId) }
        ],
        date: { $gte: startDate }
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $project: {
        date: 1,
        progressScore: '$analytics.progressScore',
        physicalScore: {
          $cond: {
            if: { $gt: ['$physicalMeasurements.bodyFat', 0] },
            then: { $subtract: [100, '$physicalMeasurements.bodyFat'] },
            else: 0
          }
        },
        performanceScore: {
          $multiply: [
            { $ifNull: ['$performanceMetrics.swimming.techniqueScore', 0] },
            10
          ]
        }
      }
    }
  ]);
};

progressSchema.statics.getComparisonStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        $or: [
          { userId: new mongoose.Types.ObjectId(userId) },
          { subscriberId: new mongoose.Types.ObjectId(userId) }
        ]
      }
    },
    {
      $sort: { date: 1 }
    },
    {
      $group: {
        _id: null,
        firstRecord: { $first: '$$ROOT' },
        lastRecord: { $last: '$$ROOT' },
        totalRecords: { $sum: 1 },
        avgProgressScore: { $avg: '$analytics.progressScore' }
      }
    }
  ]);

  if (stats.length === 0) return null;

  const { firstRecord, lastRecord, totalRecords, avgProgressScore } = stats[0];
  
  return {
    totalRecords,
    avgProgressScore: Math.round(avgProgressScore),
    improvement: lastRecord.analytics.progressScore - firstRecord.analytics.progressScore,
    period: {
      start: firstRecord.date,
      end: lastRecord.date,
      days: Math.ceil((lastRecord.date - firstRecord.date) / (1000 * 60 * 60 * 24))
    }
  };
};

// Indexes للتوافق مع الكنترولر
progressSchema.index({ userId: 1, date: -1 });
progressSchema.index({ subscriberId: 1, date: -1 });
progressSchema.index({ trainerId: 1, date: -1 });
progressSchema.index({ type: 1, date: -1 });
progressSchema.index({ userId: 1, type: 1, date: -1 });
progressSchema.index({ 'analytics.progressScore': -1 });
progressSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Progress', progressSchema);