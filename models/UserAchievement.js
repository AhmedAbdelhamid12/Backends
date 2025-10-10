const mongoose = require('mongoose');

const userAchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true,
    index: true
  },
  
  // تفاصيل الإنجاز
  earnedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  earnedBy: {
    type: String,
    enum: ['system', 'coach', 'admin'],
    default: 'system'
  },
  earnedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // البيانات الإضافية
  context: {
    sessionId: mongoose.Schema.Types.ObjectId,
    eventId: mongoose.Schema.Types.ObjectId,
    courseId: mongoose.Schema.Types.ObjectId,
    metric: String,
    value: mongoose.Schema.Types.Mixed
  },
  
  // الحالة
  isVisible: {
    type: Boolean,
    default: true
  },
  isShared: {
    type: Boolean,
    default: false
  },
  
  // الملاحظات
  notes: String,
  
  // التواريخ
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userAchievementSchema.index({ userId: 1, earnedAt: -1 });
userAchievementSchema.index({ userId: 1, achievementId: 1 });
userAchievementSchema.index({ achievementId: 1, earnedAt: -1 });

// Static Methods
userAchievementSchema.statics.getUserAchievements = function(userId, category) {
  const query = { userId };
  if (category) {
    query['achievement.category'] = category;
  }
  
  return this.find(query)
    .populate('achievementId')
    .sort({ earnedAt: -1 });
};

userAchievementSchema.statics.getRecentAchievements = function(limit = 10) {
  return this.find({ isVisible: true })
    .populate('userId', 'name email profileImage')
    .populate('achievementId')
    .sort({ earnedAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('UserAchievement', userAchievementSchema);

