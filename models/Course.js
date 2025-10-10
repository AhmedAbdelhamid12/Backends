const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  // المعلومات الأساسية
  name: {
    type: String,
    required: [true, 'اسم البرنامج مطلوب'],
    trim: true,
    maxlength: [200, 'الاسم لا يمكن أن يزيد عن 200 حرف']
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  category: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'competitive', 'rehabilitation', 'fitness', 'specialized'],
    required: true,
    index: true
  },
  level: {
    type: String,
    enum: ['level_1', 'level_2', 'level_3', 'level_4', 'level_5', 'level_6'],
    required: true
  },
  
  // المدرب والموظفين
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  assistantCoaches: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: String
  }],
  
  // المدة والجدولة
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  duration: {
    type: Number, // في الأسابيع
    required: true,
    min: 1
  },
  sessionsPerWeek: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  sessionDuration: {
    type: Number, // في الدقائق
    required: true,
    min: 30,
    max: 180,
    default: 60
  },
  schedule: [{
    dayOfWeek: {
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      required: true
    },
    startTime: String,
    endTime: String
  }],
  
  // التسجيل والحدود
  maxParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  minParticipants: {
    type: Number,
    default: 3,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0,
    min: 0
  },
  participants: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    enrolledDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['enrolled', 'active', 'completed', 'dropped', 'suspended'],
      default: 'enrolled'
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    completionDate: Date,
    certificateIssued: {
      type: Boolean,
      default: false
    }
  }],
  waitlist: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedDate: {
      type: Date,
      default: Date.now
    }
  }],
  
  // المحتوى والمنهج
  curriculum: [{
    week: Number,
    topic: String,
    objectives: [String],
    exercises: [{
      name: String,
      description: String,
      duration: Number,
      difficulty: String
    }],
    skills: [String],
    resources: [{
      type: {
        type: String,
        enum: ['video', 'document', 'link', 'image']
      },
      title: String,
      url: String,
      description: String
    }]
  }],
  learningObjectives: [String],
  prerequisites: [String],
  
  // التكلفة والدفع
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'SAR',
    uppercase: true
  },
  paymentPlan: {
    type: String,
    enum: ['full', 'installments', 'monthly'],
    default: 'full'
  },
  installments: [{
    amount: Number,
    dueDate: Date,
    paid: {
      type: Boolean,
      default: false
    },
    paidAt: Date
  }],
  
  // الموقع
  location: {
    type: String,
    required: true
  },
  pool: String,
  isOnline: {
    type: Boolean,
    default: false
  },
  meetingLink: String,
  
  // الحالة
  status: {
    type: String,
    enum: ['draft', 'published', 'enrollment_open', 'enrollment_closed', 'in_progress', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  // التقييمات والشهادات
  assessments: [{
    title: String,
    type: {
      type: String,
      enum: ['quiz', 'practical', 'project', 'exam']
    },
    date: Date,
    weight: Number, // نسبة من الدرجة النهائية
    maxScore: Number,
    results: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      score: Number,
      passed: Boolean,
      feedback: String
    }]
  }],
  certificateTemplate: String,
  
  // الإحصائيات
  stats: {
    enrollmentRate: { type: Number, min: 0, max: 100 },
    completionRate: { type: Number, min: 0, max: 100 },
    averageProgress: { type: Number, min: 0, max: 100 },
    satisfactionScore: { type: Number, min: 1, max: 10 },
    attendanceRate: { type: Number, min: 0, max: 100 }
  },
  
  // الملاحظات
  notes: {
    type: String,
    maxlength: 2000
  },
  adminNotes: {
    type: String,
    maxlength: 2000
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
  publishedAt: Date,
  cancelledAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
courseSchema.virtual('isEnrollmentOpen').get(function() {
  const now = new Date();
  return this.status === 'enrollment_open' &&
         this.startDate > now &&
         this.currentParticipants < this.maxParticipants;
});

courseSchema.virtual('isInProgress').get(function() {
  const now = new Date();
  return this.status === 'in_progress' &&
         this.startDate <= now &&
         this.endDate >= now;
});

courseSchema.virtual('weeksRemaining').get(function() {
  const now = new Date();
  if (this.endDate < now) return 0;
  const diffTime = this.endDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
});

// Indexes
courseSchema.index({ category: 1, status: 1 });
courseSchema.index({ coachId: 1, status: 1 });
courseSchema.index({ startDate: 1, endDate: 1 });
courseSchema.index({ status: 1, startDate: 1 });

// Middleware
courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // تحديث عدد المشاركين
  this.currentParticipants = this.participants.filter(
    p => p.status === 'active' || p.status === 'enrolled'
  ).length;
  
  // تحديث الحالة تلقائياً
  const now = new Date();
  if (this.status === 'enrollment_open' && this.startDate <= now) {
    this.status = 'in_progress';
  } else if (this.status === 'in_progress' && this.endDate < now) {
    this.status = 'completed';
  }
  
  next();
});

// Methods
courseSchema.methods.enrollParticipant = function(userId) {
  if (!this.isEnrollmentOpen) {
    throw new Error('التسجيل غير متاح');
  }
  
  if (this.participants.some(p => p.userId.toString() === userId.toString())) {
    throw new Error('المستخدم مسجل بالفعل');
  }
  
  this.participants.push({
    userId,
    status: this.currentParticipants < this.maxParticipants ? 'enrolled' : 'waitlist'
  });
  
  this.currentParticipants += 1;
};

courseSchema.methods.updateProgress = function(userId, progress) {
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('المستخدم غير مسجل');
  }
  
  participant.progress = Math.min(Math.max(progress, 0), 100);
  
  if (participant.progress === 100) {
    participant.status = 'completed';
    participant.completionDate = new Date();
  }
};

// Static Methods
courseSchema.statics.getAvailableCourses = function(category, level) {
  const query = {
    status: 'enrollment_open',
    startDate: { $gt: new Date() }
  };
  
  if (category) query.category = category;
  if (level) query.level = level;
  
  return this.find(query)
    .populate('coachId', 'name email specialization')
    .sort({ startDate: 1 });
};

courseSchema.statics.getCoursesByCoach = function(coachId) {
  return this.find({
    coachId,
    status: { $ne: 'cancelled' }
  })
  .populate('participants.userId', 'name email')
  .sort({ startDate: -1 });
};

module.exports = mongoose.model('Course', courseSchema);

