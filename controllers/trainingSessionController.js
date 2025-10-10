// controllers/trainingSessionController.js
const TrainingSession = require('../models/TrainingSession');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

// إنشاء جلسة تدريبية جديدة
exports.createSession = async (req, res) => {
  try {
    const {
      trainerId,
      subscriberId,
      subscriptionId,
      date,
      duration,
      type,
      location,
      notes,
      exercises
    } = req.body;

    // التحقق من وجود المدرب والمشترك
    const trainer = await User.findById(trainerId);
    const subscriber = await User.findById(subscriberId);

    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({
        success: false,
        message: 'المدرب غير موجود'
      });
    }

    if (!subscriber || subscriber.role !== 'subscriber') {
      return res.status(404).json({
        success: false,
        message: 'المشترك غير موجود'
      });
    }

    // التحقق من الاشتراك إذا تم تحديده
    if (subscriptionId) {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription || subscription.subscriberId.toString() !== subscriberId) {
        return res.status(400).json({
          success: false,
          message: 'الاشتراك غير صالح لهذا المشترك'
        });
      }

      // التحقق من أن عدد الجلسات لم يتجاوز الحد
      if (subscription.usedSessions >= subscription.totalSessions) {
        return res.status(400).json({
          success: false,
          message: 'لقد استهلكت جميع الجلسات في هذا الاشتراك'
        });
      }
    }

    // التحقق من عدم وجود تعارض في المواعيد
    const sessionStart = new Date(date);
    const sessionEnd = new Date(sessionStart.getTime() + duration * 60000);

    const conflictingSession = await TrainingSession.findOne({
      $or: [
        { 
          trainerId, 
          date: { 
            $gte: sessionStart, 
            $lt: sessionEnd 
          } 
        },
        { 
          subscriberId, 
          date: { 
            $gte: sessionStart, 
            $lt: sessionEnd 
          } 
        }
      ],
      status: { $in: ['scheduled', 'completed'] }
    });

    if (conflictingSession) {
      return res.status(400).json({
        success: false,
        message: 'هناك تعارض في الموعد مع جلسة أخرى'
      });
    }

    const session = await TrainingSession.create({
      trainerId,
      subscriberId,
      subscriptionId,
      date: sessionStart,
      duration,
      type,
      location,
      notes,
      exercises: exercises || [],
      createdBy: req.user.id
    });

    // تحميل البيانات المرتبطة
    await session.populate('trainerId', 'name email phone specialization avatar');
    await session.populate('subscriberId', 'name email phone avatar');

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الجلسة التدريبية بنجاح',
      data: session
    });
  } catch (error) {
    console.error('Create Session Error:', error);
    
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
exports.getAllSessions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      type, 
      trainerId,
      subscriberId,
      subscriptionId,
      startDate,
      endDate,
      location,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    if (trainerId) query.trainerId = trainerId;
    if (subscriberId) query.subscriberId = subscriberId;
    if (subscriptionId) query.subscriptionId = subscriptionId;
    if (location) query.location = new RegExp(location, 'i');

    // فلترة بالتاريخ
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // تحديد الصلاحيات
    if (req.user.role === 'subscriber') {
      query.subscriberId = req.user.id;
    } else if (req.user.role === 'trainer') {
      query.trainerId = req.user.id;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sessions = await TrainingSession.find(query)
      .populate('trainerId', 'name email phone specialization avatar')
      .populate('subscriberId', 'name email phone avatar')
      .populate('subscriptionId', 'planName sessionsPerWeek')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await TrainingSession.countDocuments(query);

    res.json({
      success: true,
      data: sessions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: sessions.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get Sessions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الجلسات التدريبية'
    });
  }
};

// الحصول على جلسة بواسطة ID
exports.getSessionById = async (req, res) => {
  try {
    const session = await TrainingSession.findById(req.params.id)
      .populate('trainerId', 'name email phone specialization experience bio avatar')
      .populate('subscriberId', 'name email phone birthDate emergencyContact medicalNotes avatar')
      .populate('subscriptionId', 'planName sessionsPerWeek totalSessions usedSessions')
      .populate('createdBy', 'name email');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة التدريبية غير موجودة'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'subscriber' && session.subscriberId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذه الجلسة'
      });
    }

    if (req.user.role === 'trainer' && session.trainerId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذه الجلسة'
      });
    }

    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    console.error('Get Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات الجلسة'
    });
  }
};

// تحديث جلسة تدريبية
exports.updateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // منع تحديث بعض الحقول
    delete updateData.trainerId;
    delete updateData.subscriberId;
    delete updateData.createdBy;

    const session = await TrainingSession.findById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة التدريبية غير موجودة'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'subscriber') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث الجلسة'
      });
    }

    // المدرب يمكنه فقط تحديث الجلسات الخاصة به
    if (req.user.role === 'trainer' && session.trainerId.toString() !== req.user.id) {
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

      const conflictingSession = await TrainingSession.findOne({
        _id: { $ne: id },
        $or: [
          { 
            trainerId: session.trainerId, 
            date: { 
              $gte: newDate, 
              $lt: newEnd 
            } 
          },
          { 
            subscriberId: session.subscriberId, 
            date: { 
              $gte: newDate, 
              $lt: newEnd 
            } 
          }
        ],
        status: { $in: ['scheduled', 'completed'] }
      });

      if (conflictingSession) {
        return res.status(400).json({
          success: false,
          message: 'هناك تعارض في الموعد مع جلسة أخرى'
        });
      }
    }

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('trainerId', 'name email phone specialization avatar')
    .populate('subscriberId', 'name email phone avatar')
    .populate('subscriptionId', 'planName sessionsPerWeek');

    res.json({
      success: true,
      message: 'تم تحديث الجلسة التدريبية بنجاح',
      data: updatedSession
    });
  } catch (error) {
    console.error('Update Session Error:', error);
    
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
exports.updateSessionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const session = await TrainingSession.findById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة التدريبية غير موجودة'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'subscriber') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث حالة الجلسة'
      });
    }

    if (req.user.role === 'trainer' && session.trainerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذه الجلسة'
      });
    }

    // إذا كانت الجلسة مكتملة، تحديث عدد الجلسات المستخدمة في الاشتراك
    if (status === 'completed' && session.status !== 'completed' && session.subscriptionId) {
      await Subscription.findByIdAndUpdate(session.subscriptionId, {
        $inc: { usedSessions: 1 }
      });
    }

    // إذا تم إلغاء إكمال الجلسة، تقليل عدد الجلسات المستخدمة
    if (status !== 'completed' && session.status === 'completed' && session.subscriptionId) {
      await Subscription.findByIdAndUpdate(session.subscriptionId, {
        $inc: { usedSessions: -1 }
      });
    }

    const updateData = { status };
    if (notes) updateData.notes = notes;

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
    .populate('trainerId', 'name email phone specialization avatar')
    .populate('subscriberId', 'name email phone avatar');

    res.json({
      success: true,
      message: `تم تحديث حالة الجلسة إلى ${getStatusArabic(status)} بنجاح`,
      data: updatedSession
    });
  } catch (error) {
    console.error('Update Session Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الجلسة'
    });
  }
};

// تسجيل تقدم الجلسة
exports.recordSessionProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { progressMetrics, afterSession, exercises, notes } = req.body;

    const session = await TrainingSession.findById(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة التدريبية غير موجودة'
      });
    }

    // التحقق من الصلاحيات (المدرب فقط)
    if (req.user.role !== 'trainer' || session.trainerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتسجيل تقدم الجلسة'
      });
    }

    const updateData = {};
    if (progressMetrics) updateData.progressMetrics = progressMetrics;
    if (afterSession) updateData.afterSession = afterSession;
    if (exercises) updateData.exercises = exercises;
    if (notes) updateData.notes = notes;

    // إذا كان هناك تقدم، تعتبر الجلسة مكتملة
    if (progressMetrics || afterSession) {
      updateData.status = 'completed';
    }

    const updatedSession = await TrainingSession.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('trainerId', 'name email phone specialization avatar')
    .populate('subscriberId', 'name email phone avatar');

    res.json({
      success: true,
      message: 'تم تسجيل تقدم الجلسة بنجاح',
      data: updatedSession
    });
  } catch (error) {
    console.error('Record Progress Error:', error);
    
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
exports.getUpcomingSessions = async (req, res) => {
  try {
    const { days = 7, trainerId, subscriberId } = req.query;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + parseInt(days));

    const query = {
      date: { $gte: startDate, $lte: endDate },
      status: 'scheduled'
    };

    if (trainerId) query.trainerId = trainerId;
    if (subscriberId) query.subscriberId = subscriberId;

    // تحديد الصلاحيات
    if (req.user.role === 'subscriber') {
      query.subscriberId = req.user.id;
    } else if (req.user.role === 'trainer') {
      query.trainerId = req.user.id;
    }

    const sessions = await TrainingSession.find(query)
      .populate('trainerId', 'name email phone specialization avatar')
      .populate('subscriberId', 'name email phone avatar')
      .sort({ date: 1 });

    res.json({
      success: true,
      data: sessions,
      count: sessions.length
    });
  } catch (error) {
    console.error('Get Upcoming Sessions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الجلسات القادمة'
    });
  }
};

// الحصول على إحصائيات الجلسات
exports.getSessionStats = async (req, res) => {
  try {
    const { period = 'month', trainerId, subscriberId } = req.query;
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

    const baseQuery = { createdAt: { $gte: startDate } };

    if (trainerId) baseQuery.trainerId = trainerId;
    if (subscriberId) baseQuery.subscriberId = subscriberId;

    // تحديد الصلاحيات
    if (req.user.role === 'subscriber') {
      baseQuery.subscriberId = req.user.id;
    } else if (req.user.role === 'trainer') {
      baseQuery.trainerId = req.user.id;
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
          avgTechniqueScore: { $avg: '$progressMetrics.techniqueScore' },
          avgEffortLevel: { $avg: '$progressMetrics.effortLevel' },
          totalCalories: { $sum: '$progressMetrics.calories' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    // إحصائيات المدربين (للأدمن فقط)
    let trainerStats = [];
    if (req.user.role === 'admin') {
      trainerStats = await TrainingSession.aggregate([
        { $match: { ...baseQuery, status: 'completed' } },
        {
          $group: {
            _id: '$trainerId',
            sessionCount: { $sum: 1 },
            totalDuration: { $sum: '$duration' },
            avgRating: { $avg: '$ratings.trainerRating' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'trainer'
          }
        },
        { $unwind: '$trainer' },
        {
          $project: {
            'trainer.name': 1,
            'trainer.email': 1,
            'trainer.specialization': 1,
            sessionCount: 1,
            totalDuration: 1,
            avgRating: 1
          }
        },
        { $sort: { sessionCount: -1 } }
      ]);
    }

    res.json({
      success: true,
      data: {
        totalSessions,
        completedSessions,
        cancelledSessions,
        completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
        sessionsByType,
        monthlyStats,
        trainerStats
      }
    });
  } catch (error) {
    console.error('Get Session Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الجلسات'
    });
  }
};

// تقييم الجلسة
exports.rateSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;

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

    // تحديد من يقوم بالتقييم
    const updateData = {};
    if (req.user.role === 'subscriber' && session.subscriberId.toString() === req.user.id) {
      updateData['ratings.subscriberRating'] = rating;
      if (feedback) updateData['ratings.subscriberFeedback'] = feedback;
    } else if (req.user.role === 'trainer' && session.trainerId.toString() === req.user.id) {
      updateData['ratings.trainerRating'] = rating;
      if (feedback) updateData['ratings.trainerFeedback'] = feedback;
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
    .populate('trainerId', 'name email phone specialization avatar')
    .populate('subscriberId', 'name email phone avatar');

    res.json({
      success: true,
      message: 'تم تقييم الجلسة بنجاح',
      data: updatedSession
    });
  } catch (error) {
    console.error('Rate Session Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تقييم الجلسة'
    });
  }
};

// دالة مساعدة للحصول على الحالة بالعربية
function getStatusArabic(status) {
  const statusMap = {
    'scheduled': 'مجدولة',
    'completed': 'مكتملة',
    'cancelled': 'ملغاة',
    'no-show': 'غير حاضرة'
  };
  return statusMap[status] || status;
}