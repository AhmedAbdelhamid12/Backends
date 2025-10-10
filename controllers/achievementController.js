const Achievement = require('../models/Achievement');
const UserAchievement = require('../models/UserAchievement');
const { createNotification } = require('./notificationController');
const logger = require('../utils/logger');

// الحصول على جميع الإنجازات
exports.getAllAchievements = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    const query = {};
    
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const achievements = await Achievement.find(query)
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    logger.error('Get Achievements Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإنجازات'
    });
  }
};

// الحصول على إنجازات مستخدم
exports.getUserAchievements = async (req, res) => {
  try {
    // Use userId from params, or current user if not provided
    const userId = req.params.userId || req.user._id;
    const { category } = req.query;

    const userAchievements = await UserAchievement.getUserAchievements(userId, category);

    res.json({
      success: true,
      data: {
        achievements: userAchievements
      }
    });
  } catch (error) {
    logger.error('Get User Achievements Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إنجازات المستخدم'
    });
  }
};

// منح إنجاز للمستخدم
exports.grantAchievement = async (req, res) => {
  try {
    const { userId, achievementId } = req.body;
    const { notes, context } = req.body;

    // التحقق من وجود الإنجاز
    const achievement = await Achievement.findById(achievementId);
    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'الإنجاز غير موجود'
      });
    }

    // التحقق من عدم الحصول على الإنجاز مسبقاً (إذا لم يكن قابل للتكرار)
    if (!achievement.isRepeatable) {
      const existing = await UserAchievement.findOne({ userId, achievementId });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'المستخدم حصل على هذا الإنجاز مسبقاً'
        });
      }
    }

    // إنشاء سجل الإنجاز
    const userAchievement = await UserAchievement.create({
      userId,
      achievementId,
      earnedBy: req.user.role === 'admin' ? 'admin' : 'coach',
      earnedByUser: req.user._id,
      notes,
      context
    });

    // إرسال إشعار
    await createNotification(
      userId,
      `إنجاز جديد: ${achievement.title}`,
      achievement.description,
      {
        type: 'success',
        category: 'achievement',
        actionUrl: `/achievements/${achievementId}`
      }
    );

    res.status(201).json({
      success: true,
      message: 'تم منح الإنجاز بنجاح',
      data: await userAchievement.populate('achievementId')
    });
  } catch (error) {
    logger.error('Grant Achievement Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في منح الإنجاز'
    });
  }
};

// إنشاء إنجاز جديد
exports.createAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.create(req.body);

    logger.info(`Achievement created: ${achievement.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الإنجاز بنجاح',
      data: achievement
    });
  } catch (error) {
    logger.error('Create Achievement Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الإنجاز'
    });
  }
};

// تحديث إنجاز
exports.updateAchievement = async (req, res) => {
  try {
    const achievement = await Achievement.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!achievement) {
      return res.status(404).json({
        success: false,
        message: 'الإنجاز غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الإنجاز بنجاح',
      data: achievement
    });
  } catch (error) {
    logger.error('Update Achievement Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الإنجاز'
    });
  }
};

// الحصول على الإنجازات الأخيرة
exports.getRecentAchievements = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const achievements = await UserAchievement.getRecentAchievements(parseInt(limit));

    res.json({
      success: true,
      data: achievements
    });
  } catch (error) {
    logger.error('Get Recent Achievements Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإنجازات الأخيرة'
    });
  }
};

