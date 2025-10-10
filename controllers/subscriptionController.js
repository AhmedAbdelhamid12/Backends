import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import TrainingSession from '../models/TrainingSession.js';
import { createNotification } from './notificationController.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// إنشاء indexes للتحسين الأداء
const createSubscriptionIndexes = async () => {
  try {
    await Subscription.createIndexes([
      { 'userId': 1, 'status': 1 },
      { 'coachId': 1, 'status': 1 },
      { 'endDate': 1, 'status': 1 },
      { 'planType': 1, 'status': 1 },
      { 'paymentStatus': 1, 'createdAt': 1 }
    ]);
    logger.info('Subscription indexes created successfully');
  } catch (error) {
    logger.error('Error creating subscription indexes:', error);
  }
};

// استدعاء إنشاء indexes عند التشغيل
createSubscriptionIndexes();

// التحقق من صلاحيات الاشتراك
const verifySubscriptionAccess = async (subscriptionId, userId, userRole) => {
  const subscription = await Subscription.findById(subscriptionId);
  if (!subscription) return { allowed: false, subscription: null };
  
  if (userRole === 'admin') return { allowed: true, subscription };
  if (userRole === 'coach' && subscription.coachId?.toString() === userId) return { allowed: true, subscription };
  if (userRole === 'user' && subscription.userId.toString() === userId) return { allowed: true, subscription };
  
  return { allowed: false, subscription };
};

// التحقق من توفر الجلسات في الاشتراك
export const checkSessionAvailability = async (subscriptionId, sessionDate = null) => {
  try {
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription || subscription.status !== 'active') {
      return {
        available: false,
        reason: 'الاشتراك غير نشط أو غير موجود'
      };
    }

    // التحقق من تاريخ الانتهاء
    const today = new Date();
    if (subscription.endDate < today) {
      return {
        available: false,
        reason: 'الاشتراك منتهي الصلاحية'
      };
    }

    // التحقق من عدد الجلسات المتبقية
    if (subscription.remainingSessions <= 0) {
      return {
        available: false,
        reason: 'لا توجد جلسات متبقية في الاشتراك'
      };
    }

    // التحقق من الحد الأسبوعي إذا تم تحديد تاريخ الجلسة
    if (sessionDate) {
      const sessionWeekStart = new Date(sessionDate);
      sessionWeekStart.setHours(0, 0, 0, 0);
      sessionWeekStart.setDate(sessionWeekStart.getDate() - sessionWeekStart.getDay()); // بداية الأسبوع

      const sessionWeekEnd = new Date(sessionWeekStart);
      sessionWeekEnd.setDate(sessionWeekEnd.getDate() + 6); // نهاية الأسبوع

      const weeklySessions = await TrainingSession.countDocuments({
        subscriptionId,
        date: {
          $gte: sessionWeekStart,
          $lte: sessionWeekEnd
        },
        status: { $in: ['scheduled', 'in-progress'] }
      });

      if (weeklySessions >= subscription.sessionsPerWeek) {
        return {
          available: false,
          reason: `لقد تجاوزت الحد الأسبوعي للجلسات (${subscription.sessionsPerWeek} جلسة)`
        };
      }
    }

    return {
      available: true,
      remainingSessions: subscription.remainingSessions,
      sessionsPerWeek: subscription.sessionsPerWeek
    };
  } catch (error) {
    logger.error('Check Session Availability Error:', error);
    return {
      available: false,
      reason: 'خطأ في التحقق من توفر الجلسات'
    };
  }
};

// إنشاء اشتراك جديد
export const createSubscription = async (req, res) => {
  try {
    const {
      userId,
      planType,
      planName,
      startDate,
      endDate,
      price,
      sessionsPerWeek,
      totalSessions,
      coachId,
      paymentMethod,
      autoRenew,
      notes,
      features
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!userId || !planType || !startDate || !endDate || !price) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الاشتراك غير مكتملة'
      });
    }

    // التحقق من صحة التواريخ
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      return res.status(400).json({
        success: false,
        message: 'تاريخ البداية يجب أن يكون قبل تاريخ النهاية'
      });
    }

    if (start < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إنشاء اشتراك بتاريخ بداية في الماضي'
      });
    }

    // التحقق من وجود المستخدم
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من المدرب إذا تم تحديده
    if (coachId) {
      const coach = await User.findById(coachId);
      if (!coach || coach.role !== 'coach') {
        return res.status(404).json({
          success: false,
          message: 'المدرب غير موجود'
        });
      }
    }

    // التحقق من عدم وجود اشتراك نشط للمستخدم
    const existingActiveSubscription = await Subscription.findOne({
      userId,
      status: 'active'
    });

    if (existingActiveSubscription) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم لديه اشتراك نشط بالفعل',
        data: { existingSubscription: existingActiveSubscription._id }
      });
    }

    // حساب الجلسات المتبقية
    const calculatedTotalSessions = totalSessions || sessionsPerWeek * 4; // تقديري شهري
    const remainingSessions = calculatedTotalSessions;

    // حساب تاريخ التجديد (قبل الانتهاء بـ3 أيام)
    const renewalDate = new Date(end);
    renewalDate.setDate(renewalDate.getDate() - 3);

    const subscription = await Subscription.create({
      userId,
      planType,
      planName,
      startDate: start,
      endDate: end,
      renewalDate,
      price,
      sessionsPerWeek: sessionsPerWeek || 2, // قيمة افتراضية
      totalSessions: calculatedTotalSessions,
      remainingSessions,
      coachId,
      paymentMethod: paymentMethod || 'cash',
      autoRenew: autoRenew || false,
      notes,
      features: features || [],
      createdBy: req.user._id,
      status: 'active',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid'
    });

    // تحديث علاقة المدرب مع المتدرب إذا كان هناك مدرب
    if (coachId) {
      await User.findByIdAndUpdate(coachId, {
        $addToSet: { trainees: userId }
      });

      await User.findByIdAndUpdate(userId, {
        $addToSet: { coaches: coachId }
      });
    }

    // تحديث حالة المستخدم
    await User.findByIdAndUpdate(userId, {
      hasActiveSubscription: true,
      currentSubscription: subscription._id
    });

    logger.info(`Subscription created for user ${userId} by ${req.user.email}`);

    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate('userId', 'name email phone avatar')
      .populate('coachId', 'name email phone specialization avatar')
      .populate('createdBy', 'name email');

    // إرسال إشعار للمستخدم
    await createNotification(
      userId, 
      'اشتراك جديد', 
      `تم تفعيل اشتراك ${planName} بنجاح. يبدأ في ${start.toLocaleDateString('ar-EG')} وينتهي في ${end.toLocaleDateString('ar-EG')}`,
      {
        type: 'success',
        category: 'subscription',
        relatedId: subscription._id,
        relatedModel: 'Subscription',
        actionUrl: `/subscriptions/${subscription._id}`
      }
    );

    // إرسال إشعار للمدرب إذا كان مرتبطاً
    if (coachId) {
      await createNotification(
        coachId, 
        'متدرب جديد', 
        `تم إضافة ${user.name} إلى قائمة متدربيك باشتراك ${planName}`,
        {
          type: 'info',
          category: 'subscription',
          relatedId: subscription._id,
          relatedModel: 'Subscription',
          actionUrl: `/subscriptions/${subscription._id}`
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الاشتراك بنجاح',
      data: { subscription: populatedSubscription }
    });
  } catch (error) {
    logger.error('Create Subscription Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الاشتراك'
    });
  }
};

// الحصول على جميع الاشتراكات مع فلترة متقدمة
export const getAllSubscriptions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      planType, 
      userId,
      coachId,
      paymentStatus,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (planType) query.planType = planType;
    if (userId) query.userId = userId;
    if (coachId) query.coachId = coachId;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // فلترة بالتاريخ
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }

    // تحديد الصلاحيات
    if (req.user.role === 'user') {
      query.userId = req.user._id;
    } else if (req.user.role === 'coach') {
      query.coachId = req.user._id;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const subscriptions = await Subscription.find(query)
      .populate('userId', 'name email phone avatar')
      .populate('coachId', 'name email phone specialization avatar')
      .populate('createdBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await Subscription.countDocuments(query);

    // حساب الإحصائيات السريعة
    const stats = await Subscription.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          activeSubscriptions: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$price', 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        subscriptions,
        stats: stats[0] || { totalRevenue: 0, activeSubscriptions: 0, pendingPayments: 0 },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSubscriptions: total,
          subscriptionsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get Subscriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الاشتراكات'
    });
  }
};

// الحصول على اشتراك بواسطة ID مع تفاصيل إضافية
export const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('userId', 'name email phone birthDate emergencyContact medicalNotes avatar')
      .populate('coachId', 'name email phone specialization experience avatar rating')
      .populate('createdBy', 'name email')
      .populate('cancelledBy', 'name email');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    // التحقق من الصلاحيات
    const { allowed } = await verifySubscriptionAccess(req.params.id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا الاشتراك'
      });
    }

    // جلب الجلسات المرتبطة بهذا الاشتراك
    const sessions = await TrainingSession.find({ subscriptionId: req.params.id })
      .populate('coachId', 'name email')
      .populate('userId', 'name email')
      .sort({ date: -1 })
      .limit(20);

    // جلب الإحصائيات
    const sessionStats = await TrainingSession.aggregate([
      { $match: { subscriptionId: new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    // حساب الجلسات المستخدمة هذا الأسبوع
    const weekStart = new Date();
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weeklySessions = await TrainingSession.countDocuments({
      subscriptionId: req.params.id,
      date: { $gte: weekStart },
      status: { $in: ['scheduled', 'in-progress'] }
    });

    res.json({
      success: true,
      data: { 
        subscription,
        sessions,
        analytics: {
          sessionStats,
          weeklySessions,
          weeklyLimit: subscription.sessionsPerWeek,
          utilizationRate: subscription.totalSessions > 0 ? 
            ((subscription.totalSessions - subscription.remainingSessions) / subscription.totalSessions * 100).toFixed(1) : 0
        }
      }
    });
  } catch (error) {
    logger.error('Get Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات الاشتراك'
    });
  }
};

// تحديث الاشتراك
export const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // منع تحديث بعض الحقول
    delete updateData.userId;
    delete updateData.createdBy;
    delete updateData._id;

    const { allowed, subscription } = await verifySubscriptionAccess(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا الاشتراك'
      });
    }

    // إذا تم تحديث المدرب، تحديث العلاقات
    if (updateData.coachId && updateData.coachId !== subscription.coachId?.toString()) {
      // إزالة المتدرب من المدرب القديم
      if (subscription.coachId) {
        await User.findByIdAndUpdate(subscription.coachId, {
          $pull: { trainees: subscription.userId }
        });
      }

      // إضافة المتدرب للمدرب الجديد
      const newCoach = await User.findById(updateData.coachId);
      if (newCoach && newCoach.role === 'coach') {
        await User.findByIdAndUpdate(updateData.coachId, {
          $addToSet: { trainees: subscription.userId }
        });

        await User.findByIdAndUpdate(subscription.userId, {
          $addToSet: { coaches: updateData.coachId }
        });
      }
    }

    // إذا تم تحديث تاريخ الانتهاء، إعادة حساب تاريخ التجديد
    if (updateData.endDate) {
      updateData.renewalDate = new Date(updateData.endDate);
      updateData.renewalDate.setDate(updateData.renewalDate.getDate() - 3);
    }

    // إذا تم تحديث الجلسات الكلية، تحديث الجلسات المتبقية
    if (updateData.totalSessions && updateData.totalSessions !== subscription.totalSessions) {
      const sessionsUsed = subscription.totalSessions - subscription.remainingSessions;
      updateData.remainingSessions = Math.max(0, updateData.totalSessions - sessionsUsed);
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('userId', 'name email phone avatar')
    .populate('coachId', 'name email phone specialization avatar')
    .populate('createdBy', 'name email');

    logger.info(`Subscription updated: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تحديث الاشتراك بنجاح',
      data: { subscription: updatedSubscription }
    });
  } catch (error) {
    logger.error('Update Subscription Error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الاشتراك'
    });
  }
};

// تجديد الاشتراك مع تحسينات
export const renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      newEndDate, 
      price, 
      notes, 
      planType, 
      planName, 
      sessionsPerWeek,
      totalSessions,
      carryOverSessions = false 
    } = req.body;

    const subscription = await Subscription.findById(id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    if (subscription.status !== 'active' && subscription.status !== 'expired') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تجديد هذا الاشتراك'
      });
    }

    // حساب الجلسات المحمولة إذا طلب
    let carriedOverSessions = 0;
    if (carryOverSessions && subscription.remainingSessions > 0) {
      carriedOverSessions = Math.min(subscription.remainingSessions, 5); // حد أقصى 5 جلسات محمولة
    }

    const newTotalSessions = totalSessions || subscription.totalSessions;
    const newRemainingSessions = newTotalSessions + carriedOverSessions;

    // إنشاء اشتراك جديد بناءً على القديم
    const newSubscription = await Subscription.create({
      userId: subscription.userId,
      planType: planType || subscription.planType,
      planName: planName || subscription.planName,
      startDate: new Date(),
      endDate: new Date(newEndDate),
      renewalDate: new Date(new Date(newEndDate).setDate(new Date(newEndDate).getDate() - 3)),
      price: price || subscription.price,
      sessionsPerWeek: sessionsPerWeek || subscription.sessionsPerWeek,
      totalSessions: newTotalSessions,
      remainingSessions: newRemainingSessions,
      coachId: subscription.coachId,
      paymentMethod: subscription.paymentMethod,
      autoRenew: subscription.autoRenew,
      notes: notes || `تم التجديد من الاشتراك السابق ${subscription._id}`,
      createdBy: req.user._id,
      status: 'active',
      paymentStatus: 'pending',
      previousSubscription: subscription._id,
      carriedOverSessions
    });

    // تعطيل الاشتراك القديم
    await Subscription.findByIdAndUpdate(id, { 
      status: 'expired',
      autoRenew: false,
      nextSubscription: newSubscription._id
    });

    const populatedSubscription = await Subscription.findById(newSubscription._id)
      .populate('userId', 'name email phone avatar')
      .populate('coachId', 'name email phone specialization avatar');

    // إرسال إشعار التجديد
    await createNotification(
      subscription.userId, 
      'تجديد الاشتراك', 
      `تم تجديد اشتراكك ${subscription.planName}. الجلسات المتبقية: ${newRemainingSessions}`,
      {
        type: 'success',
        category: 'subscription',
        relatedId: newSubscription._id,
        relatedModel: 'Subscription',
        actionUrl: `/subscriptions/${newSubscription._id}`
      }
    );

    logger.info(`Subscription renewed: ${id} -> ${newSubscription._id} by ${req.user.email}`);

    res.json({
      success: true,
      message: `تم تجديد الاشتراك بنجاح ${carriedOverSessions > 0 ? `مع نقل ${carriedOverSessions} جلسة` : ''}`,
      data: { subscription: populatedSubscription }
    });
  } catch (error) {
    logger.error('Renew Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تجديد الاشتراك'
    });
  }
};

// إلغاء الاشتراك مع تحسينات
export const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, refundAmount, refundReason } = req.body;

    const subscription = await Subscription.findById(id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء اشتراك غير نشط'
      });
    }

    // حساب نسبة الاسترداد بناءً على الجلسات المستخدمة
    const sessionsUsed = subscription.totalSessions - subscription.remainingSessions;
    const usageRate = subscription.totalSessions > 0 ? (sessionsUsed / subscription.totalSessions) : 0;
    
    let calculatedRefund = 0;
    if (refundAmount) {
      calculatedRefund = refundAmount;
    } else if (usageRate < 0.5) { // إذا استخدم أقل من 50%
      calculatedRefund = subscription.price * (1 - usageRate) * 0.8; // استرداد 80% من المتبقي
    }

    // تحديث حالة الاشتراك
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    subscription.cancelledBy = req.user._id;
    subscription.cancellationReason = reason;
    
    if (calculatedRefund > 0) {
      subscription.refundAmount = calculatedRefund;
      subscription.refundStatus = 'pending';
      subscription.refundReason = refundReason || 'إلغاء طوعي';
    }

    await subscription.save();

    // تحديث حالة المستخدم
    await User.findByIdAndUpdate(subscription.userId, {
      hasActiveSubscription: false,
      $unset: { currentSubscription: 1 }
    });

    // إلغاء الجلسات المستقبلية المرتبطة بهذا الاشتراك
    await TrainingSession.updateMany(
      {
        subscriptionId: id,
        date: { $gte: new Date() },
        status: 'scheduled'
      },
      {
        status: 'cancelled',
        cancellationReason: `تم إلغاء الاشتراك: ${reason}`
      }
    );

    logger.info(`Subscription cancelled: ${id} by ${req.user.email}`);

    const updatedSubscription = await Subscription.findById(id)
      .populate('userId', 'name email phone avatar')
      .populate('cancelledBy', 'name email')
      .populate('coachId', 'name email');

    // إرسال إشعار الإلغاء
    await createNotification(
      subscription.userId, 
      'إلغاء الاشتراك', 
      `تم إلغاء اشتراكك ${subscription.planName}. ${calculatedRefund > 0 ? `مبلغ الاسترداد: ${calculatedRefund} ريال` : ''}`,
      {
        type: 'warning',
        category: 'subscription',
        relatedId: subscription._id,
        relatedModel: 'Subscription',
        actionUrl: `/subscriptions/${subscription._id}`
      }
    );

    res.json({
      success: true,
      message: `تم إلغاء الاشتراك بنجاح${calculatedRefund > 0 ? ` مع استرداد ${calculatedRefund} ريال` : ''}`,
      data: { subscription: updatedSubscription }
    });
  } catch (error) {
    logger.error('Cancel Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إلغاء الاشتراك'
    });
  }
};

// إيقاف الاشتراك مؤقتاً
export const pauseSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, resumeDate } = req.body;

    const subscription = await Subscription.findById(id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إيقاف اشتراك غير نشط'
      });
    }

    // حساب فترة الإيقاف
    const pauseStart = new Date();
    const pauseEnd = new Date(resumeDate);
    
    if (pauseEnd <= pauseStart) {
      return res.status(400).json({
        success: false,
        message: 'تاريخ الاستئناف يجب أن يكون في المستقبل'
      });
    }

    // تحديث حالة الاشتراك
    subscription.status = 'paused';
    subscription.pauseHistory = subscription.pauseHistory || [];
    subscription.pauseHistory.push({
      startDate: pauseStart,
      endDate: pauseEnd,
      reason: reason,
      pausedBy: req.user._id
    });

    // تمديد تاريخ الانتهاء
    const pauseDuration = pauseEnd.getTime() - pauseStart.getTime();
    const extensionDays = Math.ceil(pauseDuration / (1000 * 60 * 60 * 24));
    subscription.endDate = new Date(subscription.endDate.getTime() + pauseDuration);
    subscription.renewalDate = new Date(subscription.endDate.getTime() - 3 * 24 * 60 * 60 * 1000);

    await subscription.save();

    // إلغاء الجلسات خلال فترة الإيقاف
    await TrainingSession.updateMany(
      {
        subscriptionId: id,
        date: { $gte: pauseStart, $lte: pauseEnd },
        status: 'scheduled'
      },
      {
        status: 'cancelled',
        cancellationReason: `تم إيقاف الاشتراك مؤقتاً: ${reason}`
      }
    );

    logger.info(`Subscription paused: ${id} until ${pauseEnd} by ${req.user.email}`);

    // جدولة استئناف الاشتراك
    scheduleSubscriptionResume(id, pauseEnd);

    res.json({
      success: true,
      message: `تم إيقاف الاشتراك مؤقتاً حتى ${pauseEnd.toLocaleDateString('ar-EG')}`,
      data: { subscription }
    });
  } catch (error) {
    logger.error('Pause Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إيقاف الاشتراك'
    });
  }
};

// استئناف الاشتراك
export const resumeSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findById(id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    if (subscription.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'الاشتراك غير موقف'
      });
    }

    // تحديث حالة الاشتراك
    subscription.status = 'active';
    if (subscription.pauseHistory && subscription.pauseHistory.length > 0) {
      subscription.pauseHistory[subscription.pauseHistory.length - 1].actualEndDate = new Date();
    }

    await subscription.save();

    logger.info(`Subscription resumed: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم استئناف الاشتراك بنجاح',
      data: { subscription }
    });
  } catch (error) {
    logger.error('Resume Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في استئناف الاشتراك'
    });
  }
};

// الحصول على الاشتراكات المنتهية قريباً مع تحسينات
export const getExpiringSubscriptions = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const date = new Date();
    date.setDate(date.getDate() + days);

    const query = {
      endDate: { $lte: date },
      status: 'active'
    };

    // تحديد الصلاحيات
    if (req.user.role === 'coach') {
      query.coachId = req.user._id;
    } else if (req.user.role === 'user') {
      query.userId = req.user._id;
    }

    const subscriptions = await Subscription.find(query)
      .populate('userId', 'name email phone avatar')
      .populate('coachId', 'name email phone avatar')
      .sort({ endDate: 1 });

    // إحصائيات إضافية
    const stats = {
      totalExpiring: subscriptions.length,
      expiringToday: subscriptions.filter(sub => 
        sub.endDate.toDateString() === new Date().toDateString()
      ).length,
      withRemainingSessions: subscriptions.filter(sub => 
        sub.remainingSessions > 0
      ).length
    };

    res.json({
      success: true,
      data: {
        subscriptions,
        stats,
        expiringWithinDays: days
      }
    });
  } catch (error) {
    logger.error('Get Expiring Subscriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الاشتراكات المنتهية'
    });
  }
};

// إحصائيات الاشتراكات المتقدمة
export const getSubscriptionStats = async (req, res) => {
  try {
    const { period = 'month', coachId } = req.query;
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const baseMatch = { createdAt: { $gte: startDate } };
    if (coachId) baseMatch.coachId = new mongoose.Types.ObjectId(coachId);

    // إحصائيات الأساسية
    const [
      totalSubscriptions,
      activeSubscriptions,
      expiredSubscriptions,
      cancelledSubscriptions,
      pausedSubscriptions
    ] = await Promise.all([
      Subscription.countDocuments(baseMatch),
      Subscription.countDocuments({ ...baseMatch, status: 'active' }),
      Subscription.countDocuments({ ...baseMatch, status: 'expired' }),
      Subscription.countDocuments({ ...baseMatch, status: 'cancelled' }),
      Subscription.countDocuments({ ...baseMatch, status: 'paused' })
    ]);

    // إحصائيات الإيرادات
    const revenueStats = await Subscription.aggregate([
      { $match: { ...baseMatch, paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          subscriptionCount: { $sum: 1 }
        }
      }
    ]);

    // الاشتراكات حسب الخطة
    const subscriptionsByPlan = await Subscription.aggregate([
      { $match: baseMatch },
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' },
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          avgSessionsUsed: { $avg: { $subtract: ['$totalSessions', '$remainingSessions'] } }
        }
      }
    ]);

    // الإيرادات الشهرية
    const monthlyRevenue = await Subscription.aggregate([
      {
        $match: {
          ...baseMatch,
          paymentStatus: 'paid'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$price' },
          count: { $sum: 1 },
          plans: { $addToSet: '$planType' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // الاشتراكات المنتهية قريباً
    const upcomingExpirations = await Subscription.countDocuments({
      ...baseMatch,
      status: 'active',
      endDate: { 
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        $gte: new Date()
      }
    });

    // معدل التجديد
    const renewalStats = await Subscription.aggregate([
      {
        $match: {
          ...baseMatch,
          previousSubscription: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          renewedCount: { $sum: 1 }
        }
      }
    ]);

    const stats = revenueStats[0] || {
      totalRevenue: 0,
      averagePrice: 0,
      minPrice: 0,
      maxPrice: 0,
      subscriptionCount: 0
    };

    const renewalRate = totalSubscriptions > 0 ? 
      ((renewalStats[0]?.renewedCount || 0) / totalSubscriptions * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        overview: {
          totalSubscriptions,
          activeSubscriptions,
          expiredSubscriptions,
          cancelledSubscriptions,
          pausedSubscriptions,
          upcomingExpirations
        },
        revenue: stats,
        byPlan: subscriptionsByPlan,
        monthlyRevenue,
        renewalRate,
        period
      }
    });
  } catch (error) {
    logger.error('Get Subscription Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الاشتراكات'
    });
  }
};

// تحديث حالة الدفع مع تحسينات
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod, transactionId, paidAmount, notes } = req.body;

    if (!paymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'حالة الدفع مطلوبة'
      });
    }

    const { allowed, subscription } = await verifySubscriptionAccess(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث حالة الدفع'
      });
    }

    const updateData = { 
      paymentStatus,
      paymentMethod: paymentMethod || subscription.paymentMethod
    };

    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    if (paidAmount) {
      updateData.paidAmount = paidAmount;
    }

    if (paymentStatus === 'paid') {
      updateData.paidAt = new Date();
      updateData.paidBy = req.user._id;
    } else if (paymentStatus === 'failed') {
      updateData.paymentFailureDate = new Date();
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('userId', 'name email phone avatar')
    .populate('coachId', 'name email phone specialization avatar')
    .populate('paidBy', 'name email');

    // إرسال إشعار بتحديث حالة الدفع
    const paymentMessages = {
      'paid': 'تم سداد الاشتراك بنجاح',
      'pending': 'في انتظار سداد الاشتراك',
      'failed': 'فشل في سداد الاشتراك',
      'refunded': 'تم استرداد المبلغ'
    };

    await createNotification(
      subscription.userId, 
      'تحديث حالة الدفع', 
      `${paymentMessages[paymentStatus]}: ${subscription.planName}`,
      {
        type: paymentStatus === 'paid' ? 'success' : 'info',
        category: 'payment',
        relatedId: subscription._id,
        relatedModel: 'Subscription',
        actionUrl: `/subscriptions/${subscription._id}`
      }
    );

    logger.info(`Payment status updated for subscription ${id}: ${paymentStatus} by ${req.user.email}`);

    res.json({
      success: true,
      message: `تم تحديث حالة الدفع إلى ${getPaymentStatusArabic(paymentStatus)} بنجاح`,
      data: { subscription: updatedSubscription }
    });
  } catch (error) {
    logger.error('Update Payment Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الدفع'
    });
  }
};

// استخدام جلسة من الاشتراك مع تحسينات
export const useSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, sessionDate } = req.body;

    const { allowed, subscription } = await verifySubscriptionAccess(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لاستخدام جلسات هذا الاشتراك'
      });
    }

    // التحقق من توفر الجلسات
    const availability = await checkSessionAvailability(id, sessionDate);
    if (!availability.available) {
      return res.status(400).json({
        success: false,
        message: availability.reason
      });
    }

    // خصم جلسة
    subscription.remainingSessions -= 1;
    subscription.usedSessions = (subscription.usedSessions || 0) + 1;
    subscription.lastSessionUsed = new Date();
    
    // إضافة الجلسة المستخدمة للسجل
    if (sessionId) {
      subscription.usedSessionsList = subscription.usedSessionsList || [];
      subscription.usedSessionsList.push({
        sessionId,
        usedAt: new Date(),
        usedBy: req.user._id
      });
    }

    await subscription.save();

    logger.info(`Session used from subscription ${id}, remaining: ${subscription.remainingSessions}`);

    res.json({
      success: true,
      message: 'تم استخدام الجلسة بنجاح',
      data: {
        remainingSessions: subscription.remainingSessions,
        usedSessions: subscription.usedSessions,
        weeklyLimit: subscription.sessionsPerWeek
      }
    });
  } catch (error) {
    logger.error('Use Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في استخدام الجلسة'
    });
  }
};

// إرجاع جلسة إلى الاشتراك
export const returnSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId, reason } = req.body;

    const { allowed, subscription } = await verifySubscriptionAccess(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لإرجاع جلسات هذا الاشتراك'
      });
    }

    // إذا تم تحديد جلسة معينة، إزالتها من السجل
    if (sessionId) {
      const sessionIndex = subscription.usedSessionsList?.findIndex(
        session => session.sessionId.toString() === sessionId
      );

      if (sessionIndex > -1) {
        subscription.usedSessionsList.splice(sessionIndex, 1);
      }
    }

    // إرجاع الجلسة
    subscription.remainingSessions += 1;
    subscription.usedSessions = Math.max(0, (subscription.usedSessions || 1) - 1);

    // تسجيل سبب الإرجاع
    subscription.returnedSessions = subscription.returnedSessions || [];
    subscription.returnedSessions.push({
      sessionId,
      returnedAt: new Date(),
      returnedBy: req.user._id,
      reason: reason || 'إرجاع الجلسة'
    });

    await subscription.save();

    logger.info(`Session returned to subscription ${id}, remaining: ${subscription.remainingSessions}`);

    res.json({
      success: true,
      message: 'تم إرجاع الجلسة بنجاح',
      data: {
        remainingSessions: subscription.remainingSessions,
        usedSessions: subscription.usedSessions
      }
    });
  } catch (error) {
    logger.error('Return Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إرجاع الجلسة'
    });
  }
};

// دوال مساعدة

// جدولة استئناف الاشتراك
const scheduleSubscriptionResume = async (subscriptionId, resumeDate) => {
  try {
    const delay = resumeDate.getTime() - Date.now();
    
    if (delay > 0) {
      setTimeout(async () => {
        try {
          const subscription = await Subscription.findById(subscriptionId);
          if (subscription && subscription.status === 'paused') {
            subscription.status = 'active';
            await subscription.save();
            
            logger.info(`Subscription auto-resumed: ${subscriptionId}`);
          }
        } catch (error) {
          logger.error('Auto-resume subscription error:', error);
        }
      }, delay);
    }
  } catch (error) {
    logger.error('Schedule subscription resume error:', error);
  }
};

// دالة مساعدة للحصول على حالة الدفع بالعربية
function getPaymentStatusArabic(status) {
  const statusMap = {
    'paid': 'مدفوع',
    'pending': 'قيد الانتظار',
    'failed': 'فاشل',
    'refunded': 'تم الاسترداد',
    'partially_paid': 'مدفوع جزئياً'
  };
  return statusMap[status] || status;
}

// دالة مساعدة للحصول على حالة الاشتراك بالعربية
function getSubscriptionStatusArabic(status) {
  const statusMap = {
    'active': 'نشط',
    'expired': 'منتهي',
    'cancelled': 'ملغى',
    'paused': 'موقف'
  };
  return statusMap[status] || status;
}

export default {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  renewSubscription,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  getExpiringSubscriptions,
  getSubscriptionStats,
  updatePaymentStatus,
  useSession,
  returnSession,
  checkSessionAvailability
};