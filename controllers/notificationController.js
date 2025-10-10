// controllers/notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../utils/emailService');

// إنشاء إشعار جديد
exports.createNotification = async (userId, title, message, options = {}) => {
  try {
    const {
      type = 'info',
      category = 'system',
      relatedId = null,
      relatedModel = null,
      priority = 'medium',
      actionUrl = null,
      sendEmail = false
    } = options;

    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      category,
      relatedId,
      relatedModel,
      priority,
      actionUrl
    });

    // إرسال بريد إلكتروني إذا طُلب
    if (sendEmail) {
      const user = await User.findById(userId);
      if (user && user.email) {
        await sendEmail(user.email, 'info', [user.name, title, message]);
        notification.sentEmail = true;
        await notification.save();
      }
    }

    return notification;
  } catch (error) {
    console.error('Create Notification Error:', error);
    throw error;
  }
};

// الحصول على إشعارات المستخدم
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, read, type, category } = req.query;
    
    const query = { userId: req.user.id };
    
    if (read !== undefined) query.read = read === 'true';
    if (type) query.type = type;
    if (category) query.category = category;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });

    res.json({
      success: true,
      data: notifications,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: notifications.length,
        totalRecords: total
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإشعارات'
    });
  }
};

// تحديث حالة الإشعار
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'تم تحديد الإشعار كمقروء'
    });
  } catch (error) {
    console.error('Mark as Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الإشعار'
    });
  }
};

// تحديد جميع الإشعارات كمقروءة
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { 
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'تم تحديد جميع الإشعارات كمقروءة'
    });
  } catch (error) {
    console.error('Mark All as Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الإشعارات'
    });
  }
};

// حذف إشعار
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف الإشعار بنجاح'
    });
  } catch (error) {
    console.error('Delete Notification Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الإشعار'
    });
  }
};

// إحصائيات الإشعارات
exports.getNotificationStats = async (req, res) => {
  try {
    const totalNotifications = await Notification.countDocuments({ 
      userId: req.user.id 
    });
    
    const unreadNotifications = await Notification.countDocuments({ 
      userId: req.user.id, 
      read: false 
    });
    
    const notificationsByCategory = await Notification.aggregate([
      { $match: { userId: req.user.id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      }
    ]);

    const recentActivity = await Notification.find({ 
      userId: req.user.id 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title message type createdAt read');

    res.json({
      success: true,
      data: {
        total: totalNotifications,
        unread: unreadNotifications,
        byCategory: notificationsByCategory,
        recent: recentActivity
      }
    });
  } catch (error) {
    console.error('Get Notification Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الإشعارات'
    });
  }
};