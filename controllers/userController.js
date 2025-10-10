// controllers/userController.js
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const TrainingSession = require('../models/TrainingSession');
const Progress = require('../models/Progress');
const logger = require('../utils/logger');
const { createNotification } = require('./notificationController');

// التحقق من صلاحيات الوصول للمستخدم
const verifyUserAccess = async (userId, currentUser) => {
  if (currentUser.role === 'admin') return { allowed: true };
  if (currentUser._id.toString() === userId) return { allowed: true };
  
  // المدرب يمكنه الوصول لمتدربيه
  if (currentUser.role === 'coach') {
    const user = await User.findById(userId);
    if (user && user.coaches && user.coaches.includes(currentUser._id)) {
      return { allowed: true, user };
    }
  }
  
  return { allowed: false };
};

// الحصول على جميع المستخدمين مع فلترة متقدمة
exports.getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      status, 
      search,
      subscriptionStatus,
      coachId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      hasActiveSubscription,
      lastLoginFrom,
      lastLoginTo
    } = req.query;
    
    const query = {};
    
    // الفلترة الأساسية
    if (role) query.role = role;
    if (status) query.status = status;
    
    // البحث المتقدم
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // فلترة بالمدرب
    if (coachId) {
      query.coaches = coachId;
    }

    // فلترة بتاريخ آخر دخول
    if (lastLoginFrom || lastLoginTo) {
      query.lastLogin = {};
      if (lastLoginFrom) query.lastLogin.$gte = new Date(lastLoginFrom);
      if (lastLoginTo) query.lastLogin.$lte = new Date(lastLoginTo);
    }

    const users = await User.find(query)
      .select('-password -resetPasswordToken -emailVerificationToken')
      .populate('coaches', 'name email specialization')
      .populate('currentSubscription', 'planName status endDate')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

    const total = await User.countDocuments(query);

    // إحصائيات سريعة
    const stats = await User.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          usersWithSubscription: { $sum: { $cond: [{ $eq: ['$hasActiveSubscription', true] }, 1, 0] } },
          avgSessions: { $avg: '$totalSessions' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        users,
        stats: stats[0] || {
          totalUsers: 0,
          activeUsers: 0,
          usersWithSubscription: 0,
          avgSessions: 0
        }
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        usersPerPage: parseInt(limit),
        totalUsers: total
      }
    });
  } catch (error) {
    logger.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستخدمين'
    });
  }
};

// الحصول على مستخدم بواسطة ID مع تفاصيل شاملة
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -emailVerificationToken')
      .populate('coaches', 'name email phone specialization avatar rating')
      .populate('currentSubscription', 'planName status startDate endDate totalSessions remainingSessions');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من الصلاحيات
    const { allowed } = await verifyUserAccess(req.params.id, req.user);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا المستخدم'
      });
    }

    // جلب الإحصائيات الإضافية
    const userStats = await getUserDetailedStats(req.params.id);

    res.json({
      success: true,
      data: {
        user,
        stats: userStats
      }
    });
  } catch (error) {
    logger.error('Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات المستخدم'
    });
  }
};

// تحديث بيانات المستخدم مع تحسينات
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // التحقق من الصلاحيات
    const { allowed } = await verifyUserAccess(id, req.user);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا المستخدم'
      });
    }

    // منع تحديث بعض الحقول
    const restrictedFields = ['password', 'email', 'role', 'createdAt', '_id'];
    
    // الأدمن فقط يمكنه تحديث بعض الحقول
    if (req.user.role !== 'admin') {
      restrictedFields.push('status', 'emailVerified', 'hasActiveSubscription');
    }

    restrictedFields.forEach(field => delete updateData[field]);

    // التحقق من صحة البيانات
    if (updateData.phone) {
      const existingUser = await User.findOne({ 
        phone: updateData.phone, 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'رقم الهاتف مسجل مسبقاً'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .select('-password -resetPasswordToken -emailVerificationToken')
    .populate('coaches', 'name email')
    .populate('currentSubscription', 'planName status');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    logger.info(`User updated: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تحديث بيانات المستخدم بنجاح',
      data: user
    });
  } catch (error) {
    logger.error('Update User Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'بيانات مكررة (بريد إلكتروني أو هاتف)'
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث المستخدم'
    });
  }
};

// تحديث حالة المستخدم مع تحسينات
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'inactive', 'suspended', 'pending'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'الحالة المحددة غير صحيحة'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // تسجيل تاريخ وتفاصيل تغيير الحالة
    const statusUpdate = {
      previousStatus: user.status,
      newStatus: status,
      changedBy: req.user._id,
      changedAt: new Date(),
      reason: reason || 'تغيير حالة من قبل المسؤول'
    };

    user.status = status;
    user.statusHistory = user.statusHistory || [];
    user.statusHistory.push(statusUpdate);

    await user.save();

    // إرسال إشعار للمستخدم إذا تم تعليق حسابه
    if (status === 'suspended') {
      await createNotification(
        user._id,
        'تم تعليق حسابك',
        `تم تعليق حسابك للأسباب التالية: ${reason || 'غير محدد'}. يرجى التواصل مع الدعم.`,
        {
          type: 'warning',
          category: 'account',
          actionUrl: '/contact-support'
        }
      );
    }

    logger.info(`User status updated: ${user.email} to ${status} by ${req.user.email}`);

    const updatedUser = await User.findById(id)
      .select('-password -resetPasswordToken -emailVerificationToken');

    res.json({
      success: true,
      message: `تم ${getStatusActionMessage(status)} المستخدم بنجاح`,
      data: updatedUser
    });
  } catch (error) {
    logger.error('Update Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة المستخدم'
    });
  }
};

// حذف مستخدم مع تحسينات (حذف ناعم)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { hardDelete = false, reason } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من الارتباطات
    const [subscriptionsCount, sessionsCount, progressCount] = await Promise.all([
      Subscription.countDocuments({ userId: id }),
      TrainingSession.countDocuments({ 
        $or: [{ coachId: id }, { userId: id }] 
      }),
      Progress.countDocuments({ userId: id })
    ]);

    const hasRelations = subscriptionsCount > 0 || sessionsCount > 0 || progressCount > 0;

    if (hardDelete && hasRelations) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف المستخدم نهائياً لأنه مرتبط ببيانات في النظام',
        data: {
          subscriptions: subscriptionsCount,
          sessions: sessionsCount,
          progressRecords: progressCount
        }
      });
    }

    if (hardDelete) {
      // حذف نهائي
      await User.findByIdAndDelete(id);
      logger.info(`User hard deleted: ${user.email} by ${req.user.email}`);
    } else {
      // حذف ناعم
      user.status = 'deleted';
      user.deletedAt = new Date();
      user.deletedBy = req.user._id;
      user.deleteReason = reason;
      // إخفاء البيانات الحساسة
      user.email = `deleted_${user._id}@deleted.com`;
      user.phone = null;
      user.name = 'مستخدم محذوف';
      user.avatar = null;
      await user.save();
      
      logger.info(`User soft deleted: ${user.email} by ${req.user.email}`);
    }

    res.json({
      success: true,
      message: `تم ${hardDelete ? 'حذف' : 'إلغاء'} المستخدم بنجاح`,
      data: {
        deletionType: hardDelete ? 'hard' : 'soft',
        relatedData: {
          subscriptions: subscriptionsCount,
          sessions: sessionsCount,
          progressRecords: progressCount
        }
      }
    });
  } catch (error) {
    logger.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المستخدم'
    });
  }
};

// استعادة مستخدم محذوف
exports.restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (user.status !== 'deleted') {
      return res.status(400).json({
        success: false,
        message: 'المستخدم غير محذوف'
      });
    }

    user.status = 'active';
    user.restoredAt = new Date();
    user.restoredBy = req.user._id;
    await user.save();

    logger.info(`User restored: ${user.email} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم استعادة المستخدم بنجاح',
      data: user
    });
  } catch (error) {
    logger.error('Restore User Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في استعادة المستخدم'
    });
  }
};

// الحصول على إحصائيات المستخدمين المتقدمة
exports.getUsersStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const dateRange = getDateRange(period);

    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentUsers,
      subscriptionStats,
      activityStats
    ] = await Promise.all([
      // إحصائيات الأساسية
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }
          }
        }
      ]),
      // المستخدمين الجدد
      User.countDocuments({
        createdAt: { $gte: dateRange.start }
      }),
      // إحصائيات الاشتراكات
      User.aggregate([
        {
          $group: {
            _id: null,
            withSubscription: { $sum: { $cond: [{ $eq: ['$hasActiveSubscription', true] }, 1, 0] } },
            withoutSubscription: { $sum: { $cond: [{ $eq: ['$hasActiveSubscription', false] }, 1, 0] } }
          }
        }
      ]),
      // إحصائيات النشاط
      User.aggregate([
        {
          $match: {
            lastLogin: { $gte: dateRange.start }
          }
        },
        {
          $group: {
            _id: null,
            activeRecently: { $sum: 1 },
            avgSessions: { $avg: '$totalSessions' }
          }
        }
      ])
    ]);

    // نمو المستخدمين
    const previousPeriod = getDateRange(period, true);
    const previousUsers = await User.countDocuments({
      createdAt: { 
        $gte: previousPeriod.start, 
        $lte: previousPeriod.end 
      }
    });

    const growthRate = previousUsers > 0 ? 
      ((recentUsers - previousUsers) / previousUsers * 100).toFixed(1) : 100;

    res.json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          recentUsers,
          growthRate: parseFloat(growthRate)
        },
        byRole: usersByRole,
        subscriptions: subscriptionStats[0] || { withSubscription: 0, withoutSubscription: 0 },
        activity: activityStats[0] || { activeRecently: 0, avgSessions: 0 },
        period
      }
    });
  } catch (error) {
    logger.error('Get Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات'
    });
  }
};

// الحصول على المدربين مع فلترة متقدمة
exports.getTrainers = async (req, res) => {
  try {
    const { 
      specialization, 
      minRating, 
      hasAvailability,
      search,
      page = 1,
      limit = 10
    } = req.query;

    const query = { 
      role: 'coach', 
      status: 'active' 
    };

    if (specialization) {
      query.specialization = new RegExp(specialization, 'i');
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }

    const trainers = await User.find(query)
      .select('name email phone specialization experience bio avatar rating totalTrainees hourlyRate availability')
      .populate('trainees', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1, name: 1 });

    const total = await User.countDocuments(query);

    // إحصائيات المدربين
    const coachesStats = await User.aggregate([
      { $match: { role: 'coach' } },
      {
        $group: {
          _id: null,
          totalCoaches: { $sum: 1 },
          avgRating: { $avg: '$rating' },
          avgExperience: { $avg: '$experience' },
          totalTrainees: { $sum: '$totalTrainees' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        trainers,
        stats: coachesStats[0] || {
          totalCoaches: 0,
          avgRating: 0,
          avgExperience: 0,
          totalTrainees: 0
        }
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTrainers: total
      }
    });
  } catch (error) {
    logger.error('Get Trainers Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المدربين'
    });
  }
};

// إضافة متدرب للمدرب مع تحسينات
exports.addTraineeToTrainer = async (req, res) => {
  try {
    const { trainerId, traineeId, startDate, notes } = req.body;

    const trainer = await User.findById(trainerId);
    const trainee = await User.findById(traineeId);

    if (!trainer || trainer.role !== 'coach') {
      return res.status(404).json({
        success: false,
        message: 'المدرب غير موجود'
      });
    }

    if (!trainee || trainee.role !== 'user') {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق إذا كان المتدرب مضافاً بالفعل
    if (trainer.trainees.includes(traineeId)) {
      return res.status(400).json({
        success: false,
        message: 'المتدرب مضاف بالفعل لهذا المدرب'
      });
    }

    // إضافة المتدرب للمدرب
    trainer.trainees.push(traineeId);
    trainer.totalTrainees = (trainer.totalTrainees || 0) + 1;
    
    // إضافة المدرب للمتدرب
    trainee.coaches = trainee.coaches || [];
    trainee.coaches.push(trainerId);

    // تسجيل تاريخ الإضافة
    const assignmentRecord = {
      trainee: traineeId,
      trainer: trainerId,
      assignedBy: req.user._id,
      assignedAt: new Date(),
      startDate: startDate ? new Date(startDate) : new Date(),
      notes
    };

    trainer.assignmentHistory = trainer.assignmentHistory || [];
    trainer.assignmentHistory.push(assignmentRecord);

    await Promise.all([trainer.save(), trainee.save()]);

    // إرسال إشعارات
    await Promise.all([
      createNotification(
        traineeId,
        'تم إضافة مدرب جديد',
        `تم إضافة المدرب ${trainer.name} إلى قائمة مدربيك`,
        {
          type: 'info',
          category: 'coaching',
          actionUrl: `/coaches/${trainerId}`
        }
      ),
      createNotification(
        trainerId,
        'متدرب جديد',
        `تم إضافة ${trainee.name} إلى قائمة متدربيك`,
        {
          type: 'info',
          category: 'coaching',
          actionUrl: `/trainees/${traineeId}`
        }
      )
    ]);

    logger.info(`Trainee ${traineeId} added to trainer ${trainerId} by ${req.user.email}`);

    const updatedTrainer = await User.findById(trainerId)
      .populate('trainees', 'name email phone');

    res.json({
      success: true,
      message: 'تم إضافة المتدرب للمدرب بنجاح',
      data: updatedTrainer
    });
  } catch (error) {
    logger.error('Add Trainee Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة المتدرب'
    });
  }
};

// إزالة متدرب من المدرب
exports.removeTraineeFromTrainer = async (req, res) => {
  try {
    const { trainerId, traineeId } = req.body;
    const { reason } = req.body;

    const trainer = await User.findById(trainerId);
    const trainee = await User.findById(traineeId);

    if (!trainer || !trainee) {
      return res.status(404).json({
        success: false,
        message: 'المدرب أو المتدرب غير موجود'
      });
    }

    // إزالة المتدرب من المدرب
    trainer.trainees = trainer.trainees.filter(id => id.toString() !== traineeId);
    trainer.totalTrainees = Math.max(0, (trainer.totalTrainees || 1) - 1);

    // إزالة المدرب من المتدرب
    trainee.coaches = trainee.coaches.filter(id => id.toString() !== trainerId);

    // تسجيل تاريخ الإزالة
    const removalRecord = {
      trainee: traineeId,
      trainer: trainerId,
      removedBy: req.user._id,
      removedAt: new Date(),
      reason: reason || 'إزالة يدوية'
    };

    trainer.removalHistory = trainer.removalHistory || [];
    trainer.removalHistory.push(removalRecord);

    await Promise.all([trainer.save(), trainee.save()]);

    logger.info(`Trainee ${traineeId} removed from trainer ${trainerId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم إزالة المتدرب من المدرب بنجاح'
    });
  } catch (error) {
    logger.error('Remove Trainee Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إزالة المتدرب'
    });
  }
};

// الحصول على متدربي المدرب
exports.getTrainerTrainees = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { page = 1, limit = 10, status } = req.query;

    const trainer = await User.findById(trainerId).populate({
      path: 'trainees',
      select: 'name email phone avatar status lastLogin hasActiveSubscription',
      match: status ? { status } : {},
      options: {
        limit: limit * 1,
        skip: (page - 1) * limit,
        sort: { name: 1 }
      },
      populate: {
        path: 'currentSubscription',
        select: 'planName status endDate'
      }
    });

    if (!trainer) {
      return res.status(404).json({
        success: false,
        message: 'المدرب غير موجود'
      });
    }

    const total = trainer.trainees.length;

    res.json({
      success: true,
      data: {
        trainer: {
          id: trainer._id,
          name: trainer.name,
          specialization: trainer.specialization
        },
        trainees: trainer.trainees
      },
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTrainees: total
      }
    });
  } catch (error) {
    logger.error('Get Trainer Trainees Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب متدربي المدرب'
    });
  }
};

// تحديث صورة المستخدم
exports.updateUserAvatar = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'يرجى اختيار صورة'
      });
    }

    const { allowed } = await verifyUserAccess(id, req.user);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث صورة هذا المستخدم'
      });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'تم تحديث الصورة بنجاح',
      data: { user }
    });
  } catch (error) {
    logger.error('Update Avatar Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الصورة'
    });
  }
};

// دوال مساعدة

// الحصول على إحصائيات مفصلة للمستخدم
const getUserDetailedStats = async (userId) => {
  const [
    sessionsStats,
    progressStats,
    subscriptionStats
  ] = await Promise.all([
    // إحصائيات الجلسات
    TrainingSession.aggregate([
      { $match: { 
        $or: [{ coachId: userId }, { userId: userId }] 
      }},
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]),
    // إحصائيات التقدم
    Progress.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalRecords: { $sum: 1 },
          avgSelfRating: { $avg: '$selfRating' },
          lastProgress: { $max: '$date' }
        }
      }
    ]),
    // إحصائيات الاشتراكات
    Subscription.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: null,
          totalSubscriptions: { $sum: 1 },
          activeSubscriptions: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
          totalSpent: { $sum: '$price' }
        }
      }
    ])
  ]);

  return {
    sessions: sessionsStats,
    progress: progressStats[0] || { totalRecords: 0, avgSelfRating: 0, lastProgress: null },
    subscriptions: subscriptionStats[0] || { totalSubscriptions: 0, activeSubscriptions: 0, totalSpent: 0 }
  };
};

// الحصول على نطاق تاريخ
const getDateRange = (period, previous = false) => {
  const now = new Date();
  let start = new Date();
  let end = new Date();

  switch (period) {
    case 'day':
      start.setDate(now.getDate() - (previous ? 2 : 1));
      end.setDate(now.getDate() - (previous ? 1 : 0));
      break;
    case 'week':
      start.setDate(now.getDate() - (previous ? 14 : 7));
      end.setDate(now.getDate() - (previous ? 7 : 0));
      break;
    case 'month':
      start.setMonth(now.getMonth() - (previous ? 2 : 1));
      end.setMonth(now.getMonth() - (previous ? 1 : 0));
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - (previous ? 2 : 1));
      end.setFullYear(now.getFullYear() - (previous ? 1 : 0));
      break;
    default:
      start = new Date(0);
      end = now;
  }

  return { start, end };
};

// رسالة تغيير الحالة
const getStatusActionMessage = (status) => {
  const messages = {
    'active': 'تفعيل',
    'inactive': 'تعطيل',
    'suspended': 'تعليق',
    'pending': 'وضع في الانتظار'
  };
  return messages[status] || 'تحديث حالة';
};

module.exports = exports;