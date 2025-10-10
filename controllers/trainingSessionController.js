import TrainingSession from '../models/TrainingSession.js';
import User from '../models/User.js';
import Subscription from '../models/Subscription.js';
import { createNotification } from './notificationController.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// إنشاء indexes للتحسين الأداء
const createIndexes = async () => {
  try {
    await TrainingSession.createIndexes([
      { 'coachId': 1, 'date': 1, 'status': 1 },
      { 'userId': 1, 'date': 1, 'status': 1 },
      { 'status': 1, 'date': 1 },
      { 'pool': 1, 'date': 1, 'status': 1 },
      { 'subscriptionId': 1, 'status': 1 }
    ]);
    logger.info('TrainingSession indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

// استدعاء إنشاء indexes عند التشغيل
createIndexes();

// التحقق من ملكية الجلسة
const verifySessionOwnership = async (sessionId, userId, userRole) => {
  const session = await TrainingSession.findById(sessionId);
  if (!session) return { allowed: false, session: null };
  
  if (userRole === 'admin') return { allowed: true, session };
  if (userRole === 'coach' && session.coachId.toString() === userId) return { allowed: true, session };
  if (userRole === 'user' && session.userId.toString() === userId) return { allowed: true, session };
  
  return { allowed: false, session };
};

// إنشاء جلسة تدريبية جديدة
export const createSession = async (req, res) => {
  try {
    const {
      coachId,
      userId,
      subscriptionId,
      date,
      duration,
      type,
      location,
      pool,
      notes,
      exercises,
      objectives
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!coachId || !userId || !date || !duration) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الجلسة غير مكتملة'
      });
    }

    // التحقق من صحة التاريخ
    const sessionStart = new Date(date);
    if (sessionStart <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن جدولة جلسة في وقت ماضي'
      });
    }

    // التحقق من وجود المدرب والمستخدم
    const coach = await User.findById(coachId);
    const user = await User.findById(userId);

    if (!coach || coach.role !== 'coach') {
      return res.status(404).json({
        success: false,
        message: 'المدرب غير موجود'
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من الاشتراك إذا تم تحديده
    if (subscriptionId) {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription || subscription.userId.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: 'الاشتراك غير صالح لهذا المستخدم'
        });
      }

      // التحقق من أن عدد الجلسات لم يتجاوز الحد
      if (subscription.remainingSessions <= 0) {
        return res.status(400).json({
          success: false,
          message: 'لقد استهلكت جميع الجلسات في هذا الاشتراك'
        });
      }

      // التحقق من أن الجلسات لا تتجاوز الحد الأسبوعي
      const weekStart = new Date();
      weekStart.setHours(0, 0, 0, 0);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const weeklySessions = await TrainingSession.countDocuments({
        subscriptionId,
        date: { $gte: weekStart },
        status: { $in: ['scheduled', 'in-progress'] }
      });

      if (weeklySessions >= subscription.sessionsPerWeek) {
        return res.status(400).json({
          success: false,
          message: 'لقد تجاوزت الحد الأسبوعي للجلسات في هذا الاشتراك'
        });
      }
    }

    // حساب وقت الانتهاء
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);

    // التحقق من عدم وجود تعارض في المواعيد للمدرب
    const coachConflict = await TrainingSession.findOne({
      coachId,
      date: { 
        $lt: sessionEnd,
        $gte: sessionStart
      },
      status: { $in: ['scheduled', 'in-progress'] }
    });

    if (coachConflict) {
      return res.status(400).json({
        success: false,
        message: 'المدرب مشغول في هذا التوقيت'
      });
    }

    // التحقق من عدم وجود تعارض في المواعيد للمستخدم
    const userConflict = await TrainingSession.findOne({
      userId,
      date: { 
        $lt: sessionEnd,
        $gte: sessionStart
      },
      status: { $in: ['scheduled', 'in-progress'] }
    });

    if (userConflict) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم لديه جلسة أخرى في هذا التوقيت'
      });
    }

    // التحقق من إشغال المسبح إذا تم تحديده
    if (pool) {
      const poolConflict = await TrainingSession.findOne({
        pool,
        date: { 
          $lt: sessionEnd,
          $gte: sessionStart
        },
        status: { $in: ['scheduled', 'in-progress'] }
      });

      if (poolConflict) {
        return res.status(400).json({
          success: false,
          message: 'المسبح مشغول في هذا التوقيت'
        });
      }
    }

    const session = await TrainingSession.create({
      coachId,
      userId,
      subscriptionId,
      date: sessionStart,
      endTime: sessionEnd,
      duration,
      type,
      location,
      pool,
      notes,
      exercises: exercises || [],
      objectives: objectives || [],
      createdBy: req.user._id
    });

    // تحميل البيانات المرتبطة
    const populatedSession = await TrainingSession.findById(session._id)
      .populate('coachId', 'name email phone specialization avatar rating')
      .populate('userId', 'name email phone avatar')
      .populate('subscriptionId', 'planName sessionsPerWeek totalSessions remainingSessions');

    // إرسال إشعار للمستخدم
    await createNotification(
      userId, 
      'جلسة تدريبية جديدة', 
      `تم جدولة جلسة تدريبية جديدة مع ${coach.name} في ${sessionStart.toLocaleDateString('ar-EG')} الساعة ${sessionStart.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
      {
        type: 'info',
        category: 'training',
        relatedId: session._id,
        relatedModel: 'TrainingSession',
        actionUrl: `/sessions/${session._id}`
      }
    );

    // إرسال إشعار للمدرب
    await createNotification(
      coachId, 
      'جلسة تدريبية جديدة', 
      `تم جدولة جلسة تدريبية جديدة مع ${user.name} في ${sessionStart.toLocaleDateString('ar-EG')} الساعة ${sessionStart.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
      {
        type: 'info',
        category: 'training',
        relatedId: session._id,
        relatedModel: 'TrainingSession',
        actionUrl: `/sessions/${session._id}`
      }
    );

    // جدولة تذكير قبل الجلسة
    scheduleSessionReminder(session._id);

    logger.info(`Training session created: ${session._id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الجلسة التدريبية بنجاح',
      data: { session: populatedSession }
    });
  } catch (error) {
    logger.error('Create Session Error:', error);
    
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
      message: 'خطأ في إنشاء الجلسة التدريبية'
    });
  }
};

// الحصول على جميع الجلسات مع فلترة متقدمة
export const getAllSessions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      coachId,
      userId,
      subscriptionId,
      startDate,
      endDate,
      location,
      pool,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (coachId) query.coachId = coachId;
    if (userId) query.userId = userId;
    if (subscriptionId) query.subscriptionId = subscriptionId;
    if (location) query.location = new RegExp(location, 'i');
    if (pool) query.pool = pool;

    // فلترة بالتاريخ
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // تحديد الصلاحيات
    if (req.user.role === 'user') {
      query.userId = req.user._id;
    } else if (req.user.role === 'coach') {
      query.coachId = req.user._id;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sessions = await TrainingSession.find(query)
      .populate('coachId', 'name email phone specialization avatar rating')
      .populate('userId', 'name email phone avatar')
      .populate('subscriptionId', 'planName sessionsPerWeek totalSessions remainingSessions')
      .populate('createdBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await TrainingSession.countDocuments(query);

    res.json({
      success: true,
      data: {
        sessions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalSessions: total,
          sessionsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    logger.error('Get Sessions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الجلسات التدريبية'
    });
  }
};

// الحصول على جلسة بواسطة ID
export const getSessionById = async (req, res) => {
  try {
    const session = await TrainingSession.findById(req.params.id)
      .populate('coachId', 'name email phone specialization experience bio avatar rating')
      .populate('userId', 'name email phone birthDate emergencyContact medicalNotes avatar')
      .populate('subscriptionId', 'planName sessionsPerWeek totalSessions usedSessions remainingSessions')
      .populate('createdBy', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة التدريبية غير موجودة'
      });
    }

    // التحقق من الصلاحيات
    const { allowed } = await verifySessionOwnership(req.params.id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذه الجلسة'
      });
    }

    res.json({
      success: true,
      data: { session }
    });
  } catch (error) {
    logger.error('Get Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات الجلسة'
    });
  }
};

// تحديث جلسة تدريبية
export const updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // منع تحديث بعض الحقول
    delete updateData.coachId;
    delete updateData.userId;
    delete updateData.createdBy;
    delete updateData.subscriptionId;

    const { allowed, session } = await verifySessionOwnership(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذه الجلسة'
      });
    }

    // إذا تم تحديث التاريخ أو المدة، التحقق من التعارضات
    if (updateData.date || updateData.duration) {
      const newDate = updateData.date ? new Date(updateData.date) : session.date;
      const newDuration = updateData.duration || session.duration;
      const newEnd = new Date(newDate.getTime() + newDuration * 60000);

      // التحقق من تعارض المدرب
      const coachConflict = await TrainingSession.findOne({
        _id: { $ne: id },
        coachId: session.coachId,
        date: { 
          $lt: newEnd,
          $gte: newDate
        },
        status: { $in: ['scheduled', 'in-progress'] }
      });

      if (coachConflict) {
        return res.status(400).json({
          success: false,
          message: 'المدرب مشغول في التوقيت الجديد'
        });
      }

      // التحقق من تعارض المستخدم
      const userConflict = await TrainingSession.findOne({
        _id: { $ne: id },
        userId: session.userId,
        date: { 
          $lt: newEnd,
          $gte: newDate
        },
        status: { $in: ['scheduled', 'in-progress'] }
      });

      if (userConflict) {
        return res.status(400).json({
          success: false,
          message: 'المستخدم لديه جلسة أخرى في التوقيت الجديد'
        });
      }

      // التحقق من إشغال المسبح
      if (updateData.pool || session.pool) {
        const poolToCheck = updateData.pool || session.pool;
        const poolConflict = await TrainingSession.findOne({
          _id: { $ne: id },
          pool: poolToCheck,
          date: { 
            $lt: newEnd,
            $gte: newDate
          },
          status: { $in: ['scheduled', 'in-progress'] }
        });

        if (poolConflict) {
          return res.status(400).json({
            success: false,
            message: 'المسبح مشغول في التوقيت الجديد'
          });
        }
      }

      // تحديث وقت الانتهاء
      updateData.endTime = newEnd;
    }

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('coachId', 'name email phone specialization avatar')
    .populate('userId', 'name email phone avatar')
    .populate('subscriptionId', 'planName sessionsPerWeek');

    // إرسال إشعار بالتحديث
    await createNotification(
      session.userId, 
      'تحديث الجلسة', 
      `تم تحديث بيانات الجلسة مع ${updatedSession.coachId.name}`,
      {
        type: 'info',
        category: 'training',
        relatedId: session._id,
        relatedModel: 'TrainingSession',
        actionUrl: `/sessions/${session._id}`
      }
    );

    logger.info(`Training session updated: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تحديث الجلسة التدريبية بنجاح',
      data: { session: updatedSession }
    });
  } catch (error) {
    logger.error('Update Session Error:', error);
    
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
      message: 'خطأ في تحديث الجلسة التدريبية'
    });
  }
};

// تحديث حالة الجلسة
export const updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, actualStart, actualEnd } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'حالة الجلسة مطلوبة'
      });
    }

    const { allowed, session } = await verifySessionOwnership(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذه الجلسة'
      });
    }

    const updateData = { status };
    
    if (notes) updateData.notes = notes;
    if (actualStart) updateData.actualStart = new Date(actualStart);
    if (actualEnd) updateData.actualEnd = new Date(actualEnd);

    // إذا كانت الجلسة مكتملة، تحديث عدد الجلسات المستخدمة في الاشتراك
    if (status === 'completed' && session.status !== 'completed' && session.subscriptionId) {
      const subscription = await Subscription.findById(session.subscriptionId);
      if (subscription && subscription.remainingSessions > 0) {
        subscription.remainingSessions -= 1;
        subscription.usedSessions = (subscription.usedSessions || 0) + 1;
        
        // إضافة الجلسة المستخدمة للسجل
        subscription.usedSessionsList = subscription.usedSessionsList || [];
        subscription.usedSessionsList.push({
          sessionId: session._id,
          usedAt: new Date(),
          usedBy: req.user._id
        });
        
        await subscription.save();
      }
    }

    // إذا تم إلغاء إكمال الجلسة، تقليل عدد الجلسات المستخدمة
    if (status !== 'completed' && session.status === 'completed' && session.subscriptionId) {
      await Subscription.findByIdAndUpdate(session.subscriptionId, {
        $inc: { 
          remainingSessions: 1,
          usedSessions: -1 
        },
        $pull: {
          usedSessionsList: { sessionId: session._id }
        }
      });
    }

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('coachId', 'name email phone specialization avatar')
    .populate('userId', 'name email phone avatar');

    // إرسال إشعار بتغيير الحالة
    const statusMessages = {
      'scheduled': 'تم جدولة الجلسة',
      'in-progress': 'بدأت الجلسة',
      'completed': 'تم إكمال الجلسة',
      'cancelled': 'تم إلغاء الجلسة',
      'no-show': 'لم يحضر المستخدم'
    };

    await createNotification(
      session.userId, 
      'تحديث حالة الجلسة', 
      `${statusMessages[status]}: ${session.type} مع ${updatedSession.coachId.name}`,
      {
        type: 'info',
        category: 'training',
        relatedId: session._id,
        relatedModel: 'TrainingSession',
        actionUrl: `/sessions/${session._id}`
      }
    );

    logger.info(`Session status updated: ${id} to ${status} by ${req.user.email}`);

    res.json({
      success: true,
      message: `تم تحديث حالة الجلسة إلى ${getStatusArabic(status)} بنجاح`,
      data: { session: updatedSession }
    });
  } catch (error) {
    logger.error('Update Session Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الجلسة'
    });
  }
};

// بدء الجلسة
export const startSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualStart } = req.body;

    const session = await TrainingSession.findById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة التدريبية غير موجودة'
      });
    }

    if (session.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن بدء جلسة غير مجدولة'
      });
    }

    // التحقق من الصلاحيات (المدرب فقط)
    if (req.user.role !== 'coach' || session.coachId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لبدء هذه الجلسة'
      });
    }

    // التحقق من التوقيت (لا يمكن البدء قبل 15 دقيقة)
    const now = new Date();
    const sessionTime = new Date(session.date);
    const timeDiff = sessionTime.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    if (minutesDiff > 15) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن بدء الجلسة قبل موعدها بـ 15 دقيقة'
      });
    }

    const updateData = {
      status: 'in-progress',
      actualStart: actualStart ? new Date(actualStart) : new Date()
    };

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('coachId', 'name email phone specialization avatar')
    .populate('userId', 'name email phone avatar');

    // إرسال إشعار ببدء الجلسة
    await createNotification(
      session.userId, 
      'بدء الجلسة', 
      `بدأت الجلسة مع ${updatedSession.coachId.name}`,
      {
        type: 'success',
        category: 'training',
        relatedId: session._id,
        relatedModel: 'TrainingSession',
        actionUrl: `/sessions/${session._id}`
      }
    );

    logger.info(`Session started: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم بدء الجلسة بنجاح',
      data: { session: updatedSession }
    });
  } catch (error) {
    logger.error('Start Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في بدء الجلسة'
    });
  }
};

// إنهاء الجلسة
export const endSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualEnd, progressNotes, nextSessionRecommendations } = req.body;

    const session = await TrainingSession.findById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة التدريبية غير موجودة'
      });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إنهاء جلسة غير قيد التنفيذ'
      });
    }

    // التحقق من الصلاحيات (المدرب فقط)
    if (req.user.role !== 'coach' || session.coachId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لإنهاء هذه الجلسة'
      });
    }

    const updateData = {
      status: 'completed',
      actualEnd: actualEnd ? new Date(actualEnd) : new Date(),
      progressNotes,
      nextSessionRecommendations
    };

    // استخدام جلسة من الاشتراك
    if (session.subscriptionId) {
      await Subscription.findByIdAndUpdate(session.subscriptionId, {
        $inc: { 
          remainingSessions: -1,
          usedSessions: 1 
        },
        $push: {
          usedSessionsList: {
            sessionId: session._id,
            usedAt: new Date(),
            usedBy: req.user._id
          }
        }
      });
    }

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('coachId', 'name email phone specialization avatar')
    .populate('userId', 'name email phone avatar');

    // إرسال إشعار بانتهاء الجلسة
    await createNotification(
      session.userId, 
      'انتهاء الجلسة', 
      `انتهت الجلسة مع ${updatedSession.coachId.name}. يمكنك مراجعة التقرير الكامل.`,
      {
        type: 'success',
        category: 'training',
        relatedId: session._id,
        relatedModel: 'TrainingSession',
        actionUrl: `/sessions/${session._id}`
      }
    );

    logger.info(`Session ended: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم إنهاء الجلسة بنجاح',
      data: { session: updatedSession }
    });
  } catch (error) {
    logger.error('End Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنهاء الجلسة'
    });
  }
};

// تسجيل تقدم الجلسة
export const recordSessionProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      metrics, 
      skillsProgress, 
      coachNotes, 
      achievements,
      media 
    } = req.body;

    const session = await TrainingSession.findById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة التدريبية غير موجودة'
      });
    }

    // التحقق من الصلاحيات (المدرب فقط)
    if (req.user.role !== 'coach' || session.coachId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتسجيل تقدم الجلسة'
      });
    }

    const updateData = {};
    if (metrics) updateData.metrics = metrics;
    if (skillsProgress) updateData.skillsProgress = skillsProgress;
    if (coachNotes) updateData.coachNotes = coachNotes;
    if (achievements) updateData.achievements = achievements;
    if (media) updateData.media = media;

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('coachId', 'name email phone specialization avatar')
    .populate('userId', 'name email phone avatar');

    logger.info(`Session progress recorded: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تسجيل تقدم الجلسة بنجاح',
      data: { session: updatedSession }
    });
  } catch (error) {
    logger.error('Record Progress Error:', error);
    
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
      message: 'خطأ في تسجيل تقدم الجلسة'
    });
  }
};

// الحصول على الجلسات القادمة
export const getUpcomingSessions = async (req, res) => {
  try {
    const { days = 7, coachId, userId } = req.query;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const query = {
      date: { $gte: startDate, $lte: endDate },
      status: { $in: ['scheduled', 'in-progress'] }
    };

    if (coachId) query.coachId = coachId;
    if (userId) query.userId = userId;

    // تحديد الصلاحيات
    if (req.user.role === 'user') {
      query.userId = req.user._id;
    } else if (req.user.role === 'coach') {
      query.coachId = req.user._id;
    }

    const sessions = await TrainingSession.find(query)
      .populate('coachId', 'name email phone specialization avatar')
      .populate('userId', 'name email phone avatar')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: {
        sessions,
        count: sessions.length,
        upcomingDays: days
      }
    });
  } catch (error) {
    logger.error('Get Upcoming Sessions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الجلسات القادمة'
    });
  }
};

// الحصول على إحصائيات الجلسات
export const getSessionStats = async (req, res) => {
  try {
    const { period = 'month', coachId, userId } = req.query;
    let startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    const baseQuery = { date: { $gte: startDate } };

    if (coachId) baseQuery.coachId = coachId;
    if (userId) baseQuery.userId = userId;

    // تحديد الصلاحيات
    if (req.user.role === 'user') {
      baseQuery.userId = req.user._id;
    } else if (req.user.role === 'coach') {
      baseQuery.coachId = req.user._id;
    }

    const totalSessions = await TrainingSession.countDocuments(baseQuery);
    const completedSessions = await TrainingSession.countDocuments({
      ...baseQuery,
      status: 'completed'
    });
    const cancelledSessions = await TrainingSession.countDocuments({
      ...baseQuery,
      status: 'cancelled'
    });
    const inProgressSessions = await TrainingSession.countDocuments({
      ...baseQuery,
      status: 'in-progress'
    });

    const sessionsByType = await TrainingSession.aggregate([
      { $match: baseQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const monthlyStats = await TrainingSession.aggregate([
      { $match: { ...baseQuery, status: 'completed' } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          sessionCount: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          totalParticipants: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          sessionCount: 1,
          totalDuration: 1,
          uniqueParticipants: { $size: '$totalParticipants' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // إحصائيات المدربين (للأدمن فقط)
    let coachStats = [];
    if (req.user.role === 'admin') {
      coachStats = await TrainingSession.aggregate([
        { $match: { ...baseQuery, status: 'completed' } },
        {
          $group: {
            _id: '$coachId',
            sessionCount: { $sum: 1 },
            totalDuration: { $sum: '$duration' },
            avgSessionDuration: { $avg: '$duration' },
            avgUserRating: { $avg: '$userRating' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'coach'
          }
        },
        { $unwind: '$coach' },
        {
          $project: {
            'coach.name': 1,
            'coach.email': 1,
            'coach.specialization': 1,
            sessionCount: 1,
            totalDuration: 1,
            avgSessionDuration: 1,
            avgUserRating: 1
          }
        },
        { $sort: { sessionCount: -1 } }
      ]);
    }

    const stats = {
      overview: {
        totalSessions,
        completedSessions,
        cancelledSessions,
        inProgressSessions,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0
      },
      byType: sessionsByType,
      monthlyStats,
      coachStats
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get Session Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الجلسات'
    });
  }
};

// تقييم الجلسة
export const rateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback, type } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'التقييم يجب أن يكون بين 1 و 5'
      });
    }

    const session = await TrainingSession.findById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة التدريبية غير موجودة'
      });
    }

    // التحقق من أن الجلسة مكتملة
    if (session.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تقييم جلسة غير مكتملة'
      });
    }

    // تحديد من يقوم بالتقييم ونوع التقييم
    const updateData = {};
    const ratingField = type === 'coach' ? 'coachRating' : 'userRating';
    const feedbackField = type === 'coach' ? 'coachFeedback' : 'userFeedback';

    if (type === 'user' && session.userId.toString() === req.user._id.toString()) {
      updateData[ratingField] = rating;
      if (feedback) updateData[feedbackField] = feedback;
    } else if (type === 'coach' && session.coachId.toString() === req.user._id.toString()) {
      updateData[ratingField] = rating;
      if (feedback) updateData[feedbackField] = feedback;
    } else {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتقييم هذه الجلسة'
      });
    }

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
    .populate('coachId', 'name email phone specialization avatar')
    .populate('userId', 'name email phone avatar');

    // إذا كان تقييم المستخدم، تحديث متوسط تقييم المدرب
    if (type === 'user') {
      await updateCoachAverageRating(session.coachId);
    }

    logger.info(`Session rated: ${id} with ${rating} stars by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تقييم الجلسة بنجاح',
      data: { session: updatedSession }
    });
  } catch (error) {
    logger.error('Rate Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تقييم الجلسة'
    });
  }
};

// إعادة جدولة الجلسة
export const rescheduleSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, reason } = req.body;

    if (!newDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'التاريخ الجديد وسبب إعادة الجدولة مطلوبان'
      });
    }

    const { allowed, session } = await verifySessionOwnership(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لإعادة جدولة هذه الجلسة'
      });
    }

    const newSessionDate = new Date(newDate);
    if (newSessionDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن جدولة جلسة في وقت ماضي'
      });
    }

    // التحقق من التعارضات
    const sessionEnd = new Date(newSessionDate.getTime() + session.duration * 60000);

    const conflicts = await TrainingSession.findOne({
      _id: { $ne: id },
      $or: [
        {
          coachId: session.coachId,
          date: { $lt: sessionEnd, $gte: newSessionDate },
          status: { $in: ['scheduled', 'in-progress'] }
        },
        {
          userId: session.userId,
          date: { $lt: sessionEnd, $gte: newSessionDate },
          status: { $in: ['scheduled', 'in-progress'] }
        }
      ]
    });

    if (conflicts) {
      return res.status(400).json({
        success: false,
        message: 'هناك تعارض في الموعد الجديد'
      });
    }

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      {
        date: newSessionDate,
        endTime: sessionEnd,
        rescheduleReason: reason,
        rescheduledBy: req.user._id,
        rescheduledAt: new Date(),
        $push: {
          rescheduleHistory: {
            from: session.date,
            to: newSessionDate,
            reason: reason,
            rescheduledBy: req.user._id,
            rescheduledAt: new Date()
          }
        }
      },
      { new: true }
    )
    .populate('coachId', 'name email phone specialization avatar')
    .populate('userId', 'name email phone avatar');

    // إرسال إشعار بإعادة الجدولة
    await createNotification(
      session.userId, 
      'إعادة جدولة الجلسة', 
      `تم إعادة جدولة الجلسة مع ${updatedSession.coachId.name} إلى ${newSessionDate.toLocaleDateString('ar-EG')}. السبب: ${reason}`,
      {
        type: 'warning',
        category: 'training',
        relatedId: session._id,
        relatedModel: 'TrainingSession',
        actionUrl: `/sessions/${session._id}`
      }
    );

    await createNotification(
      session.coachId, 
      'إعادة جدولة الجلسة', 
      `تم إعادة جدولة الجلسة مع ${updatedSession.userId.name} إلى ${newSessionDate.toLocaleDateString('ar-EG')}. السبب: ${reason}`,
      {
        type: 'warning',
        category: 'training',
        relatedId: session._id,
        relatedModel: 'TrainingSession',
        actionUrl: `/sessions/${session._id}`
      }
    );

    logger.info(`Session rescheduled: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم إعادة جدولة الجلسة بنجاح',
      data: { session: updatedSession }
    });
  } catch (error) {
    logger.error('Reschedule Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة جدولة الجلسة'
    });
  }
};

// الحصول على أداء المدرب
export const getCoachPerformance = async (req, res) => {
  try {
    const { coachId, period = 'month' } = req.query;
    const targetCoachId = coachId || req.user._id;

    // التحقق من الصلاحيات
    if (req.user.role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض أداء المدرب'
      });
    }

    if (req.user.role === 'coach' && targetCoachId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض أداء مدرب آخر'
      });
    }

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

    const stats = await TrainingSession.aggregate([
      {
        $match: {
          coachId: mongoose.Types.ObjectId(targetCoachId),
          date: { $gte: startDate },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          totalDuration: { $sum: '$duration' },
          avgRating: { $avg: '$userRating' },
          totalParticipants: { $addToSet: '$userId' },
          sessionsByType: { 
            $push: {
              type: '$type',
              duration: '$duration',
              rating: '$userRating'
            }
          }
        }
      },
      {
        $project: {
          totalSessions: 1,
          totalDuration: 1,
          avgRating: { $round: ['$avgRating', 2] },
          uniqueParticipants: { $size: '$totalParticipants' },
          avgSessionsPerParticipant: {
            $round: [
              { $divide: ['$totalSessions', { $size: '$totalParticipants' }] },
              2
            ]
          },
          typeBreakdown: {
            $map: {
              input: '$sessionsByType',
              as: 'session',
              in: {
                type: '$$session.type',
                count: 1,
                totalDuration: '$$session.duration',
                avgRating: '$$session.rating'
              }
            }
          }
        }
      }
    ]);

    const performance = stats[0] || {
      totalSessions: 0,
      totalDuration: 0,
      avgRating: 0,
      uniqueParticipants: 0,
      avgSessionsPerParticipant: 0,
      typeBreakdown: []
    };

    // جلب أحدث التقييمات
    const recentReviews = await TrainingSession.find({
      coachId: targetCoachId,
      userRating: { $exists: true, $gte: 1 }
    })
    .populate('userId', 'name avatar')
    .sort({ actualEnd: -1 })
    .limit(5)
    .select('userRating userFeedback actualEnd userId');

    res.json({
      success: true,
      data: {
        performance,
        recentReviews,
        period
      }
    });
  } catch (error) {
    logger.error('Get Coach Performance Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب أداء المدرب'
    });
  }
};

// تنظيف الجلسات القديمة
export const cleanupOldSessions = async (req, res) => {
  try {
    // للأدمن فقط
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتنظيف الجلسات'
      });
    }

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const result = await TrainingSession.deleteMany({
      status: 'completed',
      date: { $lt: threeMonthsAgo }
    });

    logger.info(`Old sessions cleanup completed: ${result.deletedCount} sessions deleted by ${req.user.email}`);

    res.json({
      success: true,
      message: `تم حذف ${result.deletedCount} جلسة قديمة`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    logger.error('Cleanup Sessions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تنظيف الجلسات القديمة'
    });
  }
};

// دالة مساعدة: جدولة تذكير قبل الجلسة
const scheduleSessionReminder = async (sessionId) => {
  // يمكن تنفيذ هذا باستخدام cron jobs أو نظام مشابه
  // هذا مثال مبسط
  try {
    const session = await TrainingSession.findById(sessionId)
      .populate('coachId userId');
    
    if (!session) return;

    const reminderTime = new Date(session.date);
    reminderTime.setHours(reminderTime.getHours() - 2); // تذكير قبل ساعتين

    // في تطبيق حقيقي، يمكن استخدام node-cron أو نظام مشابه
    setTimeout(async () => {
      const currentSession = await TrainingSession.findById(sessionId);
      if (currentSession && currentSession.status === 'scheduled') {
        await createNotification(
          session.userId, 
          'تذكير بالجلسة', 
          `لديك جلسة مع ${session.coachId.name} بعد ساعتين`,
          {
            type: 'reminder',
            category: 'training',
            relatedId: session._id,
            relatedModel: 'TrainingSession',
            actionUrl: `/sessions/${session._id}`
          }
        );

        await createNotification(
          session.coachId, 
          'تذكير بالجلسة', 
          `لديك جلسة مع ${session.userId.name} بعد ساعتين`,
          {
            type: 'reminder',
            category: 'training',
            relatedId: session._id,
            relatedModel: 'TrainingSession',
            actionUrl: `/sessions/${session._id}`
          }
        );

        logger.info(`Session reminders sent: ${sessionId}`);
      }
    }, reminderTime.getTime() - Date.now());

  } catch (error) {
    logger.error('Schedule Reminder Error:', error);
  }
};

// دالة مساعدة: تحديث متوسط تقييم المدرب
const updateCoachAverageRating = async (coachId) => {
  try {
    const stats = await TrainingSession.aggregate([
      {
        $match: {
          coachId: mongoose.Types.ObjectId(coachId),
          userRating: { $exists: true, $gte: 1 }
        }
      },
      {
        $group: {
          _id: '$coachId',
          avgRating: { $avg: '$userRating' },
          totalRatings: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await User.findByIdAndUpdate(coachId, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        totalRatings: stats[0].totalRatings
      });
    }
  } catch (error) {
    logger.error('Update Coach Rating Error:', error);
  }
};

// دالة مساعدة للحصول على الحالة بالعربية
function getStatusArabic(status) {
  const statusMap = {
    'scheduled': 'مجدولة',
    'in-progress': 'قيد التنفيذ',
    'completed': 'مكتملة',
    'cancelled': 'ملغاة',
    'no-show': 'غير حاضرة'
  };
  return statusMap[status] || status;
}

export default {
  createSession,
  getAllSessions,
  getSessionById,
  updateSession,
  updateSessionStatus,
  startSession,
  endSession,
  recordSessionProgress,
  getUpcomingSessions,
  getSessionStats,
  rateSession,
  rescheduleSession,
  getCoachPerformance,
  cleanupOldSessions
};