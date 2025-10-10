const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  // المعلومات الأساسية
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TrainingSession',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    index: true
  },
  
  // التوقيت
  sessionDate: {
    type: Date,
    required: true,
    index: true
  },
  scheduledStartTime: Date,
  scheduledEndTime: Date,
  actualArrivalTime: Date,
  actualDepartureTime: Date,
  
  // الحضور
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'excused', 'partial'],
    required: true,
    default: 'absent',
    index: true
  },
  attendanceMethod: {
    type: String,
    enum: ['manual', 'qr_code', 'check_in', 'automatic'],
    default: 'manual'
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // التفاصيل
  lateMinutes: {
    type: Number,
    min: 0,
    default: 0
  },
  attendanceDuration: {
    type: Number, // في الدقائق
    min: 0
  },
  attendancePercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  
  // الأعذار
  excuse: {
    type: String,
    enum: ['medical', 'personal', 'emergency', 'other'],
    default: null
  },
  excuseReason: String,
  excuseApproved: {
    type: Boolean,
    default: false
  },
  excuseApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  excuseApprovedAt: Date,
  
  // الملاحظات
  notes: {
    type: String,
    maxlength: 1000
  },
  coachNotes: String,
  
  // الإحصائيات
  attendanceStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSessions: {
    type: Number,
    default: 0
  },
  totalAttended: {
    type: Number,
    default: 0
  },
  
  // التواريخ
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
attendanceSchema.virtual('isOnTime').get(function() {
  if (!this.actualArrivalTime || !this.scheduledStartTime) return null;
  return this.actualArrivalTime <= this.scheduledStartTime;
});

attendanceSchema.virtual('isFullAttendance').get(function() {
  return this.status === 'present' && this.attendancePercentage >= 80;
});

// Indexes
attendanceSchema.index({ userId: 1, sessionDate: -1 });
attendanceSchema.index({ coachId: 1, sessionDate: -1 });
attendanceSchema.index({ courseId: 1, sessionDate: -1 });
attendanceSchema.index({ status: 1, sessionDate: -1 });
attendanceSchema.index({ sessionId: 1, userId: 1 }, { unique: true });

// Middleware
attendanceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // حساب مدة الحضور
  if (this.actualArrivalTime && this.actualDepartureTime) {
    const diffMs = this.actualDepartureTime - this.actualArrivalTime;
    this.attendanceDuration = Math.round(diffMs / (1000 * 60)); // تحويل لدقائق
  }
  
  // حساب نسبة الحضور
  if (this.scheduledStartTime && this.scheduledEndTime) {
    const scheduledDuration = (this.scheduledEndTime - this.scheduledStartTime) / (1000 * 60);
    if (this.attendanceDuration && scheduledDuration > 0) {
      this.attendancePercentage = Math.min(
        Math.round((this.attendanceDuration / scheduledDuration) * 100),
        100
      );
    }
  }
  
  // حساب التأخير
  if (this.actualArrivalTime && this.scheduledStartTime) {
    const lateMs = this.actualArrivalTime - this.scheduledStartTime;
    if (lateMs > 0) {
      this.lateMinutes = Math.round(lateMs / (1000 * 60));
      if (this.status === 'present') {
        this.status = 'late';
      }
    }
  }
  
  next();
});

// Methods
attendanceSchema.methods.markPresent = function(arrivalTime, departureTime) {
  this.status = 'present';
  this.actualArrivalTime = arrivalTime || new Date();
  this.actualDepartureTime = departureTime;
  
  if (this.lateMinutes === 0) {
    this.status = 'present';
  }
};

attendanceSchema.methods.markAbsent = function(excuse, reason) {
  this.status = 'absent';
  if (excuse) {
    this.excuse = excuse;
    this.excuseReason = reason;
  }
};

attendanceSchema.methods.approveExcuse = function(approvedBy) {
  this.excuseApproved = true;
  this.excuseApprovedBy = approvedBy;
  this.excuseApprovedAt = new Date();
  this.status = 'excused';
};

// Static Methods
attendanceSchema.statics.getUserAttendance = function(userId, startDate, endDate) {
  const query = { userId };
  if (startDate || endDate) {
    query.sessionDate = {};
    if (startDate) query.sessionDate.$gte = startDate;
    if (endDate) query.sessionDate.$lte = endDate;
  }
  
  return this.find(query)
    .populate('sessionId', 'date status type')
    .populate('coachId', 'name email')
    .sort({ sessionDate: -1 });
};

attendanceSchema.statics.getSessionAttendance = function(sessionId) {
  return this.find({ sessionId })
    .populate('userId', 'name email phone')
    .populate('coachId', 'name email')
    .sort({ status: 1, actualArrivalTime: 1 });
};

attendanceSchema.statics.getAttendanceStats = async function(userId, period = 'month') {
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
        userId: new mongoose.Types.ObjectId(userId),
        sessionDate: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);
  
  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const present = stats.find(s => s._id === 'present')?.count || 0;
  const attendanceRate = total > 0 ? (present / total * 100).toFixed(1) : 0;
  
  return {
    total,
    byStatus: stats,
    attendanceRate: parseFloat(attendanceRate),
    present,
    absent: stats.find(s => s._id === 'absent')?.count || 0,
    late: stats.find(s => s._id === 'late')?.count || 0
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema);

