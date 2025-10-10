import Progress from '../models/Progress.js';
import User from '../models/User.js';
import TrainingSession from '../models/TrainingSession.js';
import Subscription from '../models/Subscription.js';
import { createNotification } from './notificationController.js';
import logger from '../utils/logger.js';
import mongoose from 'mongoose';

// إنشاء indexes للتحسين الأداء
const createProgressIndexes = async () => {
  try {
    await Progress.createIndexes([
      { 'userId': 1, 'date': -1 },
      { 'sessionId': 1 },
      { 'userId': 1, 'type': 1, 'date': -1 },
      { 'metrics.category': 1, 'date': -1 }
    ]);
    logger.info('Progress indexes created successfully');
  } catch (error) {
    logger.error('Error creating progress indexes:', error);
  }
};

// استدعاء إنشاء indexes عند التشغيل
createProgressIndexes();

// التحقق من صلاحيات التقدم
const verifyProgressAccess = async (progressId, userId, userRole) => {
  const progress = await Progress.findById(progressId);
  if (!progress) return { allowed: false, progress: null };
  
  if (userRole === 'admin') return { allowed: true, progress };
  if (userRole === 'coach') {
    // المدرب يمكنه الوصول لتقدم متدربيه
    const user = await User.findById(progress.userId);
    if (user && user.coaches && user.coaches.includes(userId)) {
      return { allowed: true, progress };
    }
  }
  if (userRole === 'user' && progress.userId.toString() === userId) return { allowed: true, progress };
  
  return { allowed: false, progress };
};

// إنشاء سجل تقدم جديد مع تحسينات
export const createProgress = async (req, res) => {
  try {
    const {
      userId,
      sessionId,
      date,
      type = 'training', // training, measurement, assessment, milestone
      metrics,
      notes,
      media,
      skills,
      coachFeedback,
      selfRating,
      objectives,
      tags,
      location,
      duration,
      intensity
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!userId || !date) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم والتاريخ مطلوبان'
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

    // التحقق من الصلاحيات
    if (req.user.role === 'user' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لإنشاء سجل تقدم لهذا المستخدم'
      });
    }

    // التحقق من وجود الجلسة إذا تم تقديمها
    let session = null;
    if (sessionId) {
      session = await TrainingSession.findById(sessionId);
      if (!session) {
        return res.status(404).json({
          success: false,
          message: 'الجلسة التدريبية غير موجودة'
        });
      }

      // التحقق من أن الجلسة مرتبطة بالمستخدم
      if (session.userId.toString() !== userId) {
        return res.status(400).json({
          success: false,
          message: 'الجلسة غير مرتبطة بهذا المستخدم'
        });
      }
    }

    // التحقق من عدم تكرار سجل التقدم لنفس التاريخ والنوع
    const existingProgress = await Progress.findOne({
      userId,
      date: new Date(date),
      type
    });

    if (existingProgress) {
      return res.status(400).json({
        success: false,
        message: 'يوجد سجل تقدم مسبق لنفس التاريخ والنوع',
        data: { existingProgressId: existingProgress._id }
      });
    }

    // حساب التحسن إذا كان هناك سجلات سابقة
    let improvement = {};
    if (metrics) {
      const lastProgress = await Progress.findOne({
        userId,
        type,
        date: { $lt: new Date(date) }
      }).sort({ date: -1 });

      if (lastProgress && lastProgress.metrics) {
        improvement = calculateImprovement(metrics, lastProgress.metrics);
      }
    }

    // إنشاء سجل التقدم
    const progress = await Progress.create({
      userId,
      sessionId,
      date: new Date(date),
      type,
      metrics: metrics || {},
      improvement,
      notes,
      media: media || [],
      skills: skills || [],
      coachFeedback,
      selfRating,
      objectives: objectives || [],
      tags: tags || [],
      location,
      duration,
      intensity,
      createdBy: req.user._id,
      status: 'completed'
    });

    // تحديث آخر تقدم للمستخدم
    user.lastProgressUpdate = new Date();
    if (type === 'measurement' && metrics) {
      user.lastMeasurements = {
        ...user.lastMeasurements,
        ...metrics,
        updatedAt: new Date()
      };
    }
    await user.save();

    // إذا كانت مرتبطة بجلسة، تحديث الجلسة
    if (sessionId) {
      await TrainingSession.findByIdAndUpdate(sessionId, {
        $set: { progressRecorded: true, progressId: progress._id }
      });
    }

    logger.info(`Progress record created for user ${userId} by ${req.user.email}`);

    const populatedProgress = await Progress.findById(progress._id)
      .populate('userId', 'name email phone avatar')
      .populate('sessionId', 'title date duration type coachId')
      .populate('createdBy', 'name email');

    // إرسال إشعار للمستخدم إذا أضاف المدرب التقدم
    if (req.user.role === 'coach' || req.user.role === 'admin') {
      await createNotification(
        userId,
        'سجل تقدم جديد',
        `تم إضافة سجل تقدم جديد من قبل ${req.user.name}`,
        {
          type: 'info',
          category: 'progress',
          relatedId: progress._id,
          relatedModel: 'Progress',
          actionUrl: `/progress/${progress._id}`
        }
      );
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء سجل التقدم بنجاح',
      data: { progress: populatedProgress }
    });
  } catch (error) {
    logger.error('Create Progress Error:', error);
    
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
      message: 'خطأ في إنشاء سجل التقدم'
    });
  }
};

// الحصول على سجلات التقدم للمستخدم مع تحسينات
export const getUserProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      startDate, 
      endDate, 
      sessionId,
      type,
      tags,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    // التحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض سجلات التقدم'
      });
    }

    const query = { userId };
    
    // تطبيق الفلترة حسب التاريخ
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // الفلترة حسب الجلسة
    if (sessionId) {
      query.sessionId = sessionId;
    }

    // الفلترة حسب النوع
    if (type) {
      query.type = type;
    }

    // الفلترة حسب الوسوم
    if (tags) {
      query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const progressRecords = await Progress.find(query)
      .populate('sessionId', 'title date duration type coachId')
      .populate('createdBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await Progress.countDocuments(query);

    // حساب الإحصائيات المتقدمة
    const advancedStats = await calculateAdvancedProgressStats(userId, query);

    res.json({
      success: true,
      data: {
        progressRecords,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          recordsPerPage: parseInt(limit)
        },
        stats: advancedStats
      }
    });
  } catch (error) {
    logger.error('Get User Progress Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجلات التقدم'
    });
  }
};

// الحصول على سجل تقدم محدد مع تفاصيل إضافية
export const getProgressById = async (req, res) => {
  try {
    const { id } = req.params;

    const progress = await Progress.findById(id)
      .populate('userId', 'name email phone avatar birthDate goals')
      .populate('sessionId', 'title date duration type coachId location')
      .populate('createdBy', 'name email avatar');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'سجل التقدم غير موجود'
      });
    }

    // التحقق من الصلاحيات
    const { allowed } = await verifyProgressAccess(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا السجل'
      });
    }

    // جلب السجلات السابقة واللاحقة للمقارنة
    const previousProgress = await Progress.findOne({
      userId: progress.userId,
      type: progress.type,
      date: { $lt: progress.date }
    }).sort({ date: -1 });

    const nextProgress = await Progress.findOne({
      userId: progress.userId,
      type: progress.type,
      date: { $gt: progress.date }
    }).sort({ date: 1 });

    // جلب توصيات بناءً على التقدم
    const recommendations = await generateProgressRecommendations(progress);

    res.json({
      success: true,
      data: { 
        progress,
        context: {
          previous: previousProgress,
          next: nextProgress
        },
        recommendations
      }
    });
  } catch (error) {
    logger.error('Get Progress By ID Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجل التقدم'
    });
  }
};

// تحديث سجل التقدم مع تحسينات
export const updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // الحصول على السجل الحالي
    const existingProgress = await Progress.findById(id);
    if (!existingProgress) {
      return res.status(404).json({
        success: false,
        message: 'سجل التقدم غير موجود'
      });
    }

    // التحقق من الصلاحيات
    const { allowed } = await verifyProgressAccess(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا السجل'
      });
    }

    // إذا تم تحديث المقاييس، إعادة حساب التحسن
    if (updateData.metrics) {
      const lastProgress = await Progress.findOne({
        userId: existingProgress.userId,
        type: existingProgress.type,
        date: { $lt: existingProgress.date },
        _id: { $ne: id }
      }).sort({ date: -1 });

      if (lastProgress && lastProgress.metrics) {
        updateData.improvement = calculateImprovement(updateData.metrics, lastProgress.metrics);
      }
    }

    // تحديث البيانات
    if (updateData.date) updateData.date = new Date(updateData.date);
    
    const progress = await Progress.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('userId', 'name email avatar')
    .populate('sessionId', 'title date')
    .populate('createdBy', 'name email');

    // تسجيل تاريخ التعديل
    progress.updatedAt = new Date();
    progress.updatedBy = req.user._id;
    await progress.save();

    logger.info(`Progress record updated: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تحديث سجل التقدم بنجاح',
      data: { progress }
    });
  } catch (error) {
    logger.error('Update Progress Error:', error);
    
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
      message: 'خطأ في تحديث سجل التقدم'
    });
  }
};

// حذف سجل التقدم مع تحسينات
export const deleteProgress = async (req, res) => {
  try {
    const { id } = req.params;

    const progress = await Progress.findById(id);
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'سجل التقدم غير موجود'
      });
    }

    // التحقق من الصلاحيات
    const { allowed } = await verifyProgressAccess(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا السجل'
      });
    }

    // إذا كان مرتبطاً بجلسة، تحديث الجلسة
    if (progress.sessionId) {
      await TrainingSession.findByIdAndUpdate(progress.sessionId, {
        $unset: { progressRecorded: 1, progressId: 1 }
      });
    }

    await Progress.findByIdAndDelete(id);

    logger.info(`Progress record deleted: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم حذف سجل التقدم بنجاح',
      data: { deletedId: id }
    });
  } catch (error) {
    logger.error('Delete Progress Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف سجل التقدم'
    });
  }
};

// إحصائيات التقدم المتقدمة للمستخدم
export const getProgressStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'month', type } = req.query;

    // التحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض الإحصائيات'
      });
    }

    const stats = await calculateAdvancedProgressStats(userId, { type }, period);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get Progress Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات التقدم'
    });
  }
};

// تتبع التقدم نحو الأهداف
export const getGoalProgress = async (req, res) => {
  try {
    const { userId } = req.params;
    const { goalId } = req.query;

    // التحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض تقدم الأهداف'
      });
    }

    const user = await User.findById(userId).select('goals');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    let goals = user.goals || [];
    
    // إذا تم تحديد هدف معين
    if (goalId) {
      goals = goals.filter(goal => goal._id.toString() === goalId);
    }

    // حساب التقدم لكل هدف
    const goalsWithProgress = await Promise.all(
      goals.map(async (goal) => {
        const progress = await calculateGoalProgress(userId, goal);
        return {
          ...goal.toObject(),
          progress
        };
      })
    );

    // إحصائيات عامة للأهداف
    const goalsStats = {
      total: goalsWithProgress.length,
      completed: goalsWithProgress.filter(g => g.progress.percentage >= 100).length,
      inProgress: goalsWithProgress.filter(g => g.progress.percentage > 0 && g.progress.percentage < 100).length,
      notStarted: goalsWithProgress.filter(g => g.progress.percentage === 0).length,
      overdue: goalsWithProgress.filter(g => g.deadline && new Date(g.deadline) < new Date() && g.progress.percentage < 100).length
    };

    res.json({
      success: true,
      data: {
        goals: goalsWithProgress,
        stats: goalsStats
      }
    });
  } catch (error) {
    logger.error('Get Goal Progress Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تقدم الأهداف'
    });
  }
};

// تحليلات التقدم المقارن
export const getComparativeAnalytics = async (req, res) => {
  try {
    const { userId } = req.params;
    const { metric, period = 'month', compareWith = 'average' } = req.query;

    if (!metric) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد المقياس للمقارنة'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض التحليلات المقارنة'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // حساب تقدم المستخدم للمقياس المحدد
    const userProgress = await Progress.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: getDateRange(period),
          [`metrics.${metric}`]: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          dataPoints: {
            $push: {
              date: '$date',
              value: `$metrics.${metric}`,
              type: '$type'
            }
          },
          currentValue: { $last: `$metrics.${metric}` },
          startingValue: { $first: `$metrics.${metric}` },
          improvement: { $avg: '$improvement.percentage' }
        }
      }
    ]);

    // حساب المتوسط للمستخدمين الآخرين (بناءً على عمر، جنس، مستوى مشابه)
    let comparisonData = {};
    
    if (compareWith === 'average') {
      comparisonData = await calculateAverageProgress(metric, period, user);
    } else if (compareWith === 'coach_other_trainees') {
      comparisonData = await calculateCoachTraineesAverage(userId, metric, period);
    }

    const analytics = {
      userProgress: userProgress[0] || { dataPoints: [], currentValue: 0, startingValue: 0, improvement: 0 },
      comparison: comparisonData,
      insights: generateComparativeInsights(userProgress[0], comparisonData, metric)
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Get Comparative Analytics Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب التحليلات المقارنة'
    });
  }
};

// إنشاء تقرير تقدم شامل
export const generateProgressReport = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, reportType = 'comprehensive' } = req.body;

    // التحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user.role !== 'coach' && req.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لإنشاء تقارير التقدم'
      });
    }

    const user = await User.findById(userId)
      .populate('coaches', 'name email specialization')
      .select('name email phone birthDate goals coaches');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = { userId };
    if (startDate || endDate) {
      query.date = dateFilter;
    }

    // جلب بيانات التقدم
    const progressRecords = await Progress.find(query)
      .populate('sessionId', 'title date type coachId')
      .sort({ date: 1 });

    // جلب الجلسات المرتبطة
    const sessions = await TrainingSession.find({
      userId,
      date: dateFilter
    }).populate('coachId', 'name');

    // حساب الإحصائيات
    const stats = await calculateAdvancedProgressStats(userId, query);

    // إنشاء التقرير
    const report = {
      user: {
        name: user.name,
        email: user.email,
        coaches: user.coaches
      },
      period: {
        start: startDate || stats.dateRange.oldest,
        end: endDate || stats.dateRange.newest
      },
      summary: {
        totalSessions: sessions.length,
        totalProgressRecords: progressRecords.length,
        attendanceRate: sessions.length > 0 ? 
          (sessions.filter(s => s.status === 'completed').length / sessions.length * 100).toFixed(1) : 0,
        consistencyScore: calculateConsistencyScore(progressRecords)
      },
      progressAnalysis: stats,
      keyAchievements: extractKeyAchievements(progressRecords),
      recommendations: generateReportRecommendations(stats, user.goals),
      generatedAt: new Date(),
      generatedBy: req.user._id
    };

    logger.info(`Progress report generated for user ${userId} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم إنشاء التقرير بنجاح',
      data: { report }
    });
  } catch (error) {
    logger.error('Generate Progress Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء تقرير التقدم'
    });
  }
};

// إضافة وسائط لسجل التقدم مع تحسينات
export const addMediaToProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, url, thumbnail, description, category } = req.body;

    if (!type || !url) {
      return res.status(400).json({
        success: false,
        message: 'نوع الملف والرابط مطلوبان'
      });
    }

    const { allowed, progress } = await verifyProgressAccess(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لإضافة وسائط'
      });
    }

    const mediaItem = {
      type, // photo, video, document, scan
      url,
      thumbnail,
      description,
      category: category || 'general',
      uploadedBy: req.user._id,
      uploadedAt: new Date()
    };

    progress.media.push(mediaItem);
    await progress.save();

    const updatedProgress = await Progress.findById(id)
      .populate('media.uploadedBy', 'name email')
      .populate('userId', 'name email');

    logger.info(`Media added to progress record: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم إضافة الوسائط بنجاح',
      data: { progress: updatedProgress }
    });
  } catch (error) {
    logger.error('Add Media Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة الوسائط'
    });
  }
};

// إضافة مهارة جديدة مع تحسينات
export const addSkillToProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { skill, proficiency, notes, coachNotes, category } = req.body;

    if (!skill || proficiency === undefined) {
      return res.status(400).json({
        success: false,
        message: 'المهارة ومستوى الإتقان مطلوبان'
      });
    }

    if (proficiency < 1 || proficiency > 10) {
      return res.status(400).json({
        success: false,
        message: 'مستوى الإتقان يجب أن يكون بين 1 و 10'
      });
    }

    const { allowed, progress } = await verifyProgressAccess(id, req.user._id, req.user.role);
    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لإضافة مهارات'
      });
    }

    const skillItem = {
      skill,
      proficiency: parseInt(proficiency),
      notes,
      coachNotes: req.user.role === 'coach' || req.user.role === 'admin' ? coachNotes : undefined,
      category: category || 'technical',
      addedBy: req.user._id,
      addedAt: new Date()
    };

    // التحقق إذا كانت المهارة موجودة مسبقاً وتحديثها
    const existingSkillIndex = progress.skills.findIndex(s => s.skill === skill);
    if (existingSkillIndex !== -1) {
      // حفظ السجل التاريخي للتغييرات
      const previousProficiency = progress.skills[existingSkillIndex].proficiency;
      progress.skills[existingSkillIndex] = {
        ...progress.skills[existingSkillIndex].toObject(),
        ...skillItem,
        previousProficiency,
        improvement: proficiency - previousProficiency
      };
    } else {
      progress.skills.push(skillItem);
    }

    await progress.save();

    const updatedProgress = await Progress.findById(id)
      .populate('skills.addedBy', 'name email')
      .populate('userId', 'name email');

    logger.info(`Skill added to progress record: ${id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم إضافة المهارة بنجاح',
      data: { progress: updatedProgress }
    });
  } catch (error) {
    logger.error('Add Skill Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة المهارة'
    });
  }
};

// الحصول على تقدم مجموعة من المستخدمين مع تحسينات
export const getGroupProgress = async (req, res) => {
  try {
    const { userIds, startDate, endDate, metrics } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يرجى تحديد مستخدمين صالحين'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user.role !== 'coach') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض تقدم المجموعة'
      });
    }

    const query = { userId: { $in: userIds } };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // إذا تم تحديد مقاييس معينة
    if (metrics && Array.isArray(metrics)) {
      query.$or = metrics.map(metric => ({
        [`metrics.${metric}`]: { $exists: true }
      }));
    }

    const groupProgress = await Progress.find(query)
      .populate('userId', 'name email avatar birthDate')
      .populate('sessionId', 'title date type')
      .sort({ date: -1 });

    // تجميع البيانات حسب المستخدم
    const progressByUser = {};
    const userStats = {};

    for (const userId of userIds) {
      const userProgress = groupProgress.filter(p => p.userId._id.toString() === userId);
      progressByUser[userId] = userProgress;
      
      // حساب إحصائيات لكل مستخدم
      userStats[userId] = await calculateAdvancedProgressStats(userId, {
        userId: userId,
        date: query.date
      });
    }

    // إحصائيات المجموعة
    const groupStats = await Progress.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$userId',
          totalRecords: { $sum: 1 },
          avgSelfRating: { $avg: '$selfRating' },
          lastActivity: { $max: '$date' },
          skillsCount: { $sum: { $size: '$skills' } },
          metricsAvg: {
            $push: '$metrics'
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' }
    ]);

    // تحليلات مقارنة للمجموعة
    const comparativeAnalysis = await generateGroupComparativeAnalysis(groupStats, metrics);

    res.json({
      success: true,
      data: {
        progressByUser,
        userStats,
        groupStats,
        comparativeAnalysis,
        totalUsers: userIds.length,
        totalRecords: groupProgress.length,
        dateRange: {
          start: startDate,
          end: endDate
        }
      }
    });
  } catch (error) {
    logger.error('Get Group Progress Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تقدم المجموعة'
    });
  }
};

// دوال مساعدة محسنة

// حساب الإحصائيات المتقدمة
const calculateAdvancedProgressStats = async (userId, query = {}, period = 'all') => {
  const dateRange = getDateRange(period);
  const finalQuery = {
    userId: new mongoose.Types.ObjectId(userId),
    ...query,
    date: { ...query.date, ...dateRange }
  };

  const [
    generalStats,
    skillsStats,
    metricsOverTime,
    typeDistribution,
    consistency
  ] = await Promise.all([
    // الإحصائيات العامة
    Progress.aggregate([
      { $match: finalQuery },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          avgSelfRating: { $avg: '$selfRating' },
          totalSkills: { $sum: { $size: '$skills' } },
          firstSession: { $min: '$date' },
          lastSession: { $max: '$date' },
          totalDuration: { $sum: '$duration' },
          avgIntensity: { $avg: '$intensity' }
        }
      }
    ]),

    // إحصائيات المهارات
    Progress.aggregate([
      { $match: finalQuery },
      { $unwind: '$skills' },
      {
        $group: {
          _id: '$skills.skill',
          count: { $sum: 1 },
          avgProficiency: { $avg: '$skills.proficiency' },
          maxProficiency: { $max: '$skills.proficiency' },
          minProficiency: { $min: '$skills.proficiency' },
          improvement: { $avg: '$skills.improvement' }
        }
      },
      { $sort: { avgProficiency: -1 } }
    ]),

    // تقدم المقاييس مع الوقت
    Progress.aggregate([
      { $match: finalQuery },
      {
        $project: {
          date: 1,
          metrics: 1,
          month: { $month: '$date' },
          year: { $year: '$date' }
        }
      },
      {
        $group: {
          _id: { year: '$year', month: '$month' },
          metrics: { $push: '$metrics' },
          recordCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]),

    // توزيع أنواع السجلات
    Progress.aggregate([
      { $match: finalQuery },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          avgSelfRating: { $avg: '$selfRating' }
        }
      }
    ]),

    // قياس الاتساق
    calculateConsistencyMetrics(userId, finalQuery)
  ]);

  const general = generalStats[0] || {
    totalSessions: 0,
    avgSelfRating: 0,
    totalSkills: 0,
    firstSession: null,
    lastSession: null,
    totalDuration: 0,
    avgIntensity: 0
  };

  return {
    general,
    skills: skillsStats,
    metricsOverTime,
    typeDistribution,
    consistency,
    dateRange: {
      oldest: general.firstSession,
      newest: general.lastSession
    }
  };
};

// حساب التحسن بين سجلين
const calculateImprovement = (currentMetrics, previousMetrics) => {
  const improvement = {};
  let totalImprovement = 0;
  let metricsCount = 0;

  for (const [key, currentValue] of Object.entries(currentMetrics)) {
    if (previousMetrics[key] !== undefined && typeof currentValue === 'number') {
      const previousValue = previousMetrics[key];
      const change = currentValue - previousValue;
      const percentage = previousValue !== 0 ? (change / previousValue) * 100 : 100;
      
      improvement[key] = {
        change,
        percentage: Math.round(percentage * 100) / 100,
        direction: change >= 0 ? 'improved' : 'declined'
      };

      totalImprovement += percentage;
      metricsCount++;
    }
  }

  improvement.overall = metricsCount > 0 ? {
    percentage: Math.round((totalImprovement / metricsCount) * 100) / 100,
    metricsCount
  } : { percentage: 0, metricsCount: 0 };

  return improvement;
};

// توليد توصيات بناءً على التقدم
const generateProgressRecommendations = async (progress) => {
  const recommendations = [];

  // تحليل المهارات
  if (progress.skills && progress.skills.length > 0) {
    const weakSkills = progress.skills.filter(skill => skill.proficiency < 5);
    if (weakSkills.length > 0) {
      recommendations.push({
        type: 'skill_improvement',
        priority: 'high',
        message: `التركيز على تحسين ${weakSkills.length} مهارة تحتاج تطوير`,
        skills: weakSkills.map(s => s.skill)
      });
    }

    const strongSkills = progress.skills.filter(skill => skill.proficiency >= 8);
    if (strongSkills.length > 0) {
      recommendations.push({
        type: 'skill_maintenance',
        priority: 'low',
        message: `الحفاظ على ${strongSkills.length} مهارة متقنة`,
        skills: strongSkills.map(s => s.skill)
      });
    }
  }

  // تحليل الاتساق
  const lastMonthProgress = await Progress.countDocuments({
    userId: progress.userId,
    date: {
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    }
  });

  if (lastMonthProgress < 4) {
    recommendations.push({
      type: 'consistency',
      priority: 'medium',
      message: 'زيادة وتيرة التسجيل لتحسين تتبع التقدم',
      suggestedFrequency: '2-3 مرات أسبوعياً'
    });
  }

  return recommendations;
};

// دوال مساعدة أخرى
const getDateRange = (period) => {
  const now = new Date();
  let startDate = new Date(0); // بداية الزمن

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'quarter':
      startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(0);
  }

  return { $gte: startDate, $lte: now };
};

// حساب اتساق التسجيل
const calculateConsistencyMetrics = async (userId, query) => {
  const records = await Progress.find(query).sort({ date: 1 });
  
  if (records.length < 2) {
    return { score: 0, frequency: 'low', recommendation: 'زيادة وتيرة التسجيل' };
  }

  // حساب الفترات بين التسجيلات
  const intervals = [];
  for (let i = 1; i < records.length; i++) {
    const interval = (records[i].date - records[i-1].date) / (1000 * 60 * 60 * 24); // أيام
    intervals.push(interval);
  }

  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const consistencyScore = Math.max(0, 100 - (avgInterval * 10)); // كلما قل الفاصل زادت النسبة

  let frequency = 'low';
  if (avgInterval <= 2) frequency = 'high';
  else if (avgInterval <= 7) frequency = 'medium';

  return {
    score: Math.round(consistencyScore),
    frequency,
    avgInterval: Math.round(avgInterval * 10) / 10,
    totalRecords: records.length
  };
};

export default {
  createProgress,
  getUserProgress,
  getProgressById,
  updateProgress,
  deleteProgress,
  getProgressStats,
  getGoalProgress,
  getComparativeAnalytics,
  generateProgressReport,
  addMediaToProgress,
  addSkillToProgress,
  getGroupProgress
};