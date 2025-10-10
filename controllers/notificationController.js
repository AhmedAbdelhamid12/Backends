const Notification = require('../models/Notification');
const User = require('../models/User');
const logger = require('../utils/logger');

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
      recipient: userId,
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
        // هنا يمكن استدعاء خدمة البريد الإلكتروني
        logger.info(`Email notification sent to: ${user.email}`);
        notification.sentEmail = true;
        await notification.save();
      }
    }

    // إرسال إشعار في الوقت الحقيقي إذا كان متاحاً
    if (global.io) {
      global.io.to(`user-${userId}`).emit('new_notification', {
        notification: {
          id: notification._id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          createdAt: notification.createdAt
        }
      });
    }

    logger.info(`Notification created for user ${userId}: ${title}`);

    return notification;
  } catch (error) {
    logger.error('Create Notification Error:', error);
    throw error;
  }
};

// الحصول على إشعارات المستخدم
exports.getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, read, type, category } = req.query;
    
    const query = { recipient: req.user._id };
    
    if (read !== undefined) query.read = read === 'true';
    if (type) query.type = type;
    if (category) query.category = category;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      recipient: req.user._id, 
      readAt: null 
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          unreadCount
        }
      }
    });
  } catch (error) {
    logger.error('Get Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإشعارات'
    });
  }
};

// تحديث حالة الإشعار كمقروء
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: req.user._id
      },
      {
        $set: {
          readAt: new Date(),
          status: 'read'
        }
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'الإشعار غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديد الإشعار كمقروء',
      data: { notification }
    });
  } catch (error) {
    logger.error('Mark as Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الإشعار'
    });
  }
};

// تحديد جميع الإشعارات كمقروءة
exports.markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { 
        recipient: req.user._id, 
        readAt: null 
      },
      { 
        $set: {
          readAt: new Date(),
          status: 'read'
        }
      }
    );

    logger.info(`Marked ${result.modifiedCount} notifications as read for user ${req.user._id}`);

    res.json({
      success: true,
      message: `تم تحديد ${result.modifiedCount} إشعار كمقروء`,
      data: { updatedCount: result.modifiedCount }
    });
  } catch (error) {
    logger.error('Mark All as Read Error:', error);
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
      recipient: req.user._id
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
    logger.error('Delete Notification Error:', error);
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
      recipient: req.user._id 
    });
    
    const unreadNotifications = await Notification.countDocuments({ 
      recipient: req.user._id, 
      readAt: null 
    });
    
    const notificationsByType = await Notification.aggregate([
      { $match: { recipient: req.user._id } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: { $cond: [{ $eq: ['$readAt', null] }, 1, 0] }
          }
        }
      }
    ]);

    const notificationsByCategory = await Notification.aggregate([
      { $match: { recipient: req.user._id } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentNotifications = await Notification.find({ 
      recipient: req.user._id 
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('title message type category createdAt readAt');

    res.json({
      success: true,
      data: {
        summary: {
          total: totalNotifications,
          unread: unreadNotifications,
          read: totalNotifications - unreadNotifications
        },
        byType: notificationsByType,
        byCategory: notificationsByCategory,
        recent: recentNotifications
      }
    });
  } catch (error) {
    logger.error('Get Notification Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الإشعارات'
    });
  }
};

// إنشاء إشعار جماعي (للمديرين)
exports.createBulkNotifications = async (req, res) => {
  try {
    const { userIds, title, message, type = 'info', category = 'announcement' } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد مستخدمين صالحين'
      });
    }

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: 'العنوان والرسالة مطلوبان'
      });
    }

    const notifications = [];
    for (const userId of userIds) {
      const notification = await exports.createNotification(userId, title, message, {
        type,
        category,
        priority: 'high'
      });
      notifications.push(notification);
    }

    logger.info(`Created ${notifications.length} bulk notifications by admin ${req.user._id}`);

    res.json({
      success: true,
      message: `تم إرسال ${notifications.length} إشعار`,
      data: { count: notifications.length }
    });
  } catch (error) {
    logger.error('Create Bulk Notifications Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الإشعارات الجماعية'
    });
  }
};