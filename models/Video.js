const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  // المعلومات الأساسية
  title: {
    type: String,
    required: [true, 'عنوان الفيديو مطلوب'],
    trim: true,
    maxlength: [200, 'العنوان لا يمكن أن يزيد عن 200 حرف']
  },
  description: {
    type: String,
    maxlength: 5000
  },
  category: {
    type: String,
    enum: ['technique', 'training', 'tutorial', 'competition', 'analysis', 'motivational', 'other'],
    required: true,
    index: true
  },
  tags: [String],
  
  // الملف والرابط
  videoUrl: {
    type: String,
    required: true
  },
  thumbnailUrl: String,
  duration: {
    type: Number, // في الثواني
    min: 0
  },
  fileSize: Number, // في البايت
  format: {
    type: String,
    enum: ['mp4', 'webm', 'youtube', 'vimeo', 'other']
  },
  
  // المحتوى
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'all'],
    default: 'all'
  },
  swimmingStyle: {
    type: String,
    enum: ['freestyle', 'backstroke', 'breaststroke', 'butterfly', 'medley', 'all', 'other']
  },
  skills: [String],
  
  // المالك والمنشئ
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  
  // الصلاحيات والوصول
  accessLevel: {
    type: String,
    enum: ['public', 'members', 'premium', 'private', 'course'],
    default: 'members',
    index: true
  },
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  },
  
  // الإحصائيات
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  likes: {
    type: Number,
    default: 0,
    min: 0
  },
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  watchedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    watchedAt: {
      type: Date,
      default: Date.now
    },
    watchTime: Number, // في الثواني
    completed: {
      type: Boolean,
      default: false
    }
  }],
  
  // الحالة
  status: {
    type: String,
    enum: ['processing', 'published', 'unlisted', 'archived'],
    default: 'processing',
    index: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  
  // التفاصيل التقنية
  resolution: String,
  quality: {
    type: String,
    enum: ['sd', 'hd', 'full_hd', '4k']
  },
  subtitles: [{
    language: String,
    url: String
  }],
  
  // الملاحظات
  notes: {
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
  publishedAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
videoSchema.virtual('averageWatchTime').get(function() {
  if (this.watchedBy.length === 0) return 0;
  const totalWatchTime = this.watchedBy.reduce((sum, w) => sum + (w.watchTime || 0), 0);
  return Math.round(totalWatchTime / this.watchedBy.length);
});

videoSchema.virtual('completionRate').get(function() {
  if (this.watchedBy.length === 0) return 0;
  const completed = this.watchedBy.filter(w => w.completed).length;
  return Math.round((completed / this.watchedBy.length) * 100);
});

// Indexes
videoSchema.index({ category: 1, status: 1 });
videoSchema.index({ uploadedBy: 1, status: 1 });
videoSchema.index({ accessLevel: 1, status: 1 });
videoSchema.index({ isFeatured: 1, createdAt: -1 });
videoSchema.index({ createdAt: -1 });

// Middleware
videoSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Methods
videoSchema.methods.recordView = function(userId) {
  this.views += 1;
  
  const existingWatch = this.watchedBy.find(
    w => w.userId.toString() === userId.toString()
  );
  
  if (!existingWatch) {
    this.watchedBy.push({
      userId,
      watchedAt: new Date()
    });
  }
};

videoSchema.methods.updateWatchTime = function(userId, watchTime, completed) {
  const watchRecord = this.watchedBy.find(
    w => w.userId.toString() === userId.toString()
  );
  
  if (watchRecord) {
    watchRecord.watchTime = watchTime;
    watchRecord.completed = completed || false;
  } else {
    this.watchedBy.push({
      userId,
      watchTime,
      completed: completed || false
    });
  }
  
  this.views += 1;
};

videoSchema.methods.addComment = function(userId, comment) {
  this.comments.push({
    userId,
    comment,
    createdAt: new Date()
  });
};

// Static Methods
videoSchema.statics.getVideosByCategory = function(category, limit = 10) {
  return this.find({
    category,
    status: 'published'
  })
  .sort({ views: -1, createdAt: -1 })
  .limit(limit)
  .populate('uploadedBy', 'name email')
  .populate('coachId', 'name email');
};

videoSchema.statics.getFeaturedVideos = function(limit = 10) {
  return this.find({
    isFeatured: true,
    status: 'published'
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('uploadedBy', 'name email');
};

module.exports = mongoose.model('Video', videoSchema);

