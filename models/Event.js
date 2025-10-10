const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // المعلومات الأساسية
  title: {
    type: String,
    required: [true, 'عنوان الحدث مطلوب'],
    trim: true,
    maxlength: [200, 'العنوان لا يمكن أن يزيد عن 200 حرف']
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  type: {
    type: String,
    enum: ['competition', 'tournament', 'workshop', 'seminar', 'exhibition', 'social', 'other'],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['swimming', 'diving', 'water_polo', 'synchronized_swimming', 'triathlon', 'other'],
    default: 'swimming'
  },
  
  // التوقيت والموقع
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  registrationDeadline: Date,
  location: {
    name: String,
    address: {
      street: String,
      city: String,
      country: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    }
  },
  venue: String,
  pool: String,
  
  // التسجيل والمشاركة
  registrationRequired: {
    type: Boolean,
    default: true
  },
  registrationFee: {
    type: Number,
    min: 0,
    default: 0
  },
  maxParticipants: {
    type: Number,
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
    registrationDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'confirmed', 'cancelled', 'waitlist'],
      default: 'registered'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending'
    },
    category: String,
    notes: String
  }],
  
  // المسابقات
  competitions: [{
    name: String,
    category: String,
    ageGroup: String,
    gender: {
      type: String,
      enum: ['male', 'female', 'mixed']
    },
    distance: String,
    style: {
      type: String,
      enum: ['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'medley', 'relay']
    },
    startTime: Date,
    maxSwimmers: Number,
    registeredSwimmers: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      lane: Number,
      seedTime: String,
      result: {
        time: String,
        position: Number,
        points: Number
      }
    }],
    results: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      time: String,
      position: Number,
      points: Number,
      disqualified: {
        type: Boolean,
        default: false
      },
      disqualificationReason: String
    }]
  }],
  
  // المنظمون والحكام
  organizers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['organizer', 'judge', 'referee', 'coordinator', 'volunteer']
    }
  }],
  
  // الجوائز
  awards: [{
    competitionId: mongoose.Schema.Types.ObjectId,
    position: {
      type: Number,
      required: true
    },
    awardType: {
      type: String,
      enum: ['medal', 'trophy', 'certificate', 'cash', 'other']
    },
    description: String,
    value: Number
  }],
  
  // الحالة
  status: {
    type: String,
    enum: ['draft', 'published', 'registration_open', 'registration_closed', 'ongoing', 'completed', 'cancelled'],
    default: 'draft',
    index: true
  },
  
  // الصور والوسائط
  images: [{
    url: String,
    description: String,
    uploadedAt: Date
  }],
  videos: [{
    url: String,
    description: String,
    uploadedAt: Date
  }],
  
  // القواعد واللوائح
  rules: [String],
  eligibility: {
    minAge: Number,
    maxAge: Number,
    requiredLevel: String,
    prerequisites: [String]
  },
  
  // الإشعارات
  notifications: [{
    type: {
      type: String,
      enum: ['registration', 'reminder', 'update', 'result', 'cancellation']
    },
    title: String,
    message: String,
    sentAt: Date,
    recipients: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  }],
  
  // الإحصائيات
  stats: {
    totalRegistrations: { type: Number, default: 0 },
    totalCompetitions: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0 },
    attendanceRate: { type: Number, min: 0, max: 100 },
    revenue: { type: Number, default: 0 }
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
eventSchema.virtual('isUpcoming').get(function() {
  return this.startDate > new Date();
});

eventSchema.virtual('isOngoing').get(function() {
  const now = new Date();
  return this.startDate <= now && this.endDate >= now;
});

eventSchema.virtual('isPast').get(function() {
  return this.endDate < new Date();
});

eventSchema.virtual('canRegister').get(function() {
  const now = new Date();
  return this.registrationRequired &&
         this.status === 'registration_open' &&
         (!this.registrationDeadline || this.registrationDeadline > now) &&
         this.currentParticipants < (this.maxParticipants || Infinity);
});

eventSchema.virtual('daysUntilStart').get(function() {
  const now = new Date();
  const diffTime = this.startDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Indexes
eventSchema.index({ type: 1, status: 1 });
eventSchema.index({ startDate: 1, endDate: 1 });
eventSchema.index({ status: 1, startDate: 1 });
eventSchema.index({ createdAt: -1 });

// Middleware
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // تحديث عدد المشاركين
  this.currentParticipants = this.participants.filter(
    p => p.status === 'registered' || p.status === 'confirmed'
  ).length;
  
  // تحديث الحالة تلقائياً
  const now = new Date();
  if (this.status === 'published' && this.startDate <= now && this.endDate >= now) {
    this.status = 'ongoing';
  } else if (this.status === 'ongoing' && this.endDate < now) {
    this.status = 'completed';
  }
  
  next();
});

// Methods
eventSchema.methods.registerParticipant = function(userId, category, notes) {
  if (!this.canRegister) {
    throw new Error('التسجيل غير متاح');
  }
  
  if (this.participants.some(p => p.userId.toString() === userId.toString())) {
    throw new Error('المستخدم مسجل بالفعل');
  }
  
  this.participants.push({
    userId,
    category,
    notes,
    status: this.currentParticipants < this.maxParticipants ? 'registered' : 'waitlist'
  });
  
  this.currentParticipants += 1;
  this.stats.totalRegistrations += 1;
};

eventSchema.methods.cancelRegistration = function(userId) {
  const participant = this.participants.find(
    p => p.userId.toString() === userId.toString()
  );
  
  if (!participant) {
    throw new Error('المستخدم غير مسجل');
  }
  
  participant.status = 'cancelled';
  this.currentParticipants -= 1;
  
  // نقل من قائمة الانتظار
  const waitlisted = this.participants.find(
    p => p.status === 'waitlist'
  );
  if (waitlisted) {
    waitlisted.status = 'registered';
    this.currentParticipants += 1;
  }
};

eventSchema.methods.recordResult = function(competitionIndex, userId, time, position, points, disqualified, reason) {
  const competition = this.competitions[competitionIndex];
  if (!competition) {
    throw new Error('المسابقة غير موجودة');
  }
  
  competition.results.push({
    userId,
    time,
    position,
    points,
    disqualified: disqualified || false,
    disqualificationReason: reason
  });
  
  // تحديث نتيجة السباح المسجل
  const registered = competition.registeredSwimmers.find(
    s => s.userId.toString() === userId.toString()
  );
  if (registered) {
    registered.result = { time, position, points };
  }
};

// Static Methods
eventSchema.statics.getUpcomingEvents = function(limit = 10) {
  return this.find({
    status: { $in: ['published', 'registration_open'] },
    startDate: { $gt: new Date() }
  })
  .sort({ startDate: 1 })
  .limit(limit)
  .populate('participants.userId', 'name email')
  .populate('organizers.userId', 'name email');
};

eventSchema.statics.getOngoingEvents = function() {
  const now = new Date();
  return this.find({
    status: 'ongoing',
    startDate: { $lte: now },
    endDate: { $gte: now }
  })
  .populate('participants.userId', 'name email')
  .populate('competitions.registeredSwimmers.userId', 'name email');
};

eventSchema.statics.getPastEvents = function(limit = 10) {
  return this.find({
    status: 'completed',
    endDate: { $lt: new Date() }
  })
  .sort({ endDate: -1 })
  .limit(limit)
  .populate('participants.userId', 'name email');
};

module.exports = mongoose.model('Event', eventSchema);

