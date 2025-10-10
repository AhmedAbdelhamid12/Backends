const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  // المعلومات الأساسية
  title: {
    type: String,
    required: [true, 'عنوان الإنجاز مطلوب'],
    trim: true,
    maxlength: [200, 'العنوان لا يمكن أن يزيد عن 200 حرف']
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  category: {
    type: String,
    enum: ['attendance', 'progress', 'competition', 'milestone', 'skill', 'social', 'other'],
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['badge', 'certificate', 'trophy', 'medal', 'ribbon'],
    default: 'badge',
    required: true
  },
  
  // المعايير
  criteria: {
    type: {
      type: String,
      enum: ['manual', 'automatic', 'points', 'count', 'streak', 'custom'],
      required: true
    },
    targetValue: mongoose.Schema.Types.Mixed,
    metric: String, // e.g., 'sessions_attended', 'distance_swam', 'competitions_won'
    operator: {
      type: String,
      enum: ['>=', '>', '==', '<=', '<'],
      default: '>='
    }
  },
  
  // المكافآت
  rewards: {
    points: {
      type: Number,
      default: 0,
      min: 0
    },
    badge: {
      icon: String,
      color: String,
      rarity: {
        type: String,
        enum: ['common', 'rare', 'epic', 'legendary'],
        default: 'common'
      }
    },
    certificate: {
      template: String,
      downloadable: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // الصور والوسائط
  icon: String,
  image: String,
  badgeImage: String,
  
  // الإعدادات
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isRepeatable: {
    type: Boolean,
    default: false
  },
  maxEarned: {
    type: Number,
    default: 1,
    min: 1
  },
  displayOrder: {
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

// Indexes
achievementSchema.index({ category: 1, isActive: 1 });
achievementSchema.index({ 'criteria.type': 1 });

// Static Methods
achievementSchema.statics.getAvailableAchievements = function(category) {
  const query = { isActive: true };
  if (category) query.category = category;
  
  return this.find(query).sort({ displayOrder: 1, createdAt: -1 });
};

achievementSchema.statics.checkAchievement = async function(userId, metric, value) {
  const achievements = await this.find({
    isActive: true,
    'criteria.metric': metric,
    'criteria.type': 'automatic'
  });
  
  const earned = [];
  
  for (const achievement of achievements) {
    const { targetValue, operator } = achievement.criteria;
    let earnedAchievement = false;
    
    switch (operator) {
      case '>=':
        earnedAchievement = value >= targetValue;
        break;
      case '>':
        earnedAchievement = value > targetValue;
        break;
      case '==':
        earnedAchievement = value === targetValue;
        break;
      case '<=':
        earnedAchievement = value <= targetValue;
        break;
      case '<':
        earnedAchievement = value < targetValue;
        break;
    }
    
    if (earnedAchievement) {
      earned.push(achievement);
    }
  }
  
  return earned;
};

module.exports = mongoose.model('Achievement', achievementSchema);

