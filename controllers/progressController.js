// controllers/progressController.js
const Progress = require('../models/Progress');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');
const Subscription = require('../models/Subscription');

// تسجيل تقدم جديد
exports.recordProgress = async (req, res) => {
  try {
    const {
      subscriberId,
      type,
      title,
      physicalMeasurements,
      performanceMetrics,
      goals,
      lifestyle,
      notes,
      trainerFeedback,
      overallRating,
      recommendations
    } = req.body;

    // التحقق من وجود المشترك
    const subscriber = await User.findById(subscriberId);
    if (!subscriber || subscriber.role !== 'subscriber') {
      return res.status(404).json({
        success: false,
        message: 'المشترك غير موجود'
      });
    }

    // التحقق من أن المدرب مسؤول عن هذا المشترك
    if (req.user.role === 'trainer') {
      const isTrainerForSubscriber = await User.findOne({
        _id: subscriberId,
        trainerId: req.user.id
      });
      
      if (!isTrainerForSubscriber && !subscriber.trainerId?.equals(req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لتسجيل تقدم هذا المشترك'
        });
      }
    }

    const progress = await Progress.create({
      subscriberId,
      trainerId: req.user.role === 'trainer' ? req.user.id : null,
      type,
      title,
      physicalMeasurements,
      performanceMetrics,
      goals,
      lifestyle,
      notes,
      trainerFeedback,
      overallRating,
      recommendations,
      createdBy: req.user.id
    });

    await progress.populate('subscriberId', 'name email phone avatar');
    await progress.populate('trainerId', 'name email phone specialization avatar');

    res.status(201).json({
      success: true,
      message: 'تم تسجيل التقدم بنجاح',
      data: progress
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
      message: 'خطأ في تسجيل التقدم'
    });
  }
};

// الحصول على سجل التقدم
exports.getProgressHistory = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      subscriberId,
      trainerId,
      type,
      startDate,
      endDate,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (subscriberId) query.subscriberId = subscriberId;
    if (trainerId) query.trainerId = trainerId;
    if (type) query.type = type;

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

    const progressRecords = await Progress.find(query)
      .populate('subscriberId', 'name email phone avatar')
      .populate('trainerId', 'name email phone specialization avatar')
      .populate('createdBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await Progress.countDocuments(query);

    res.json({
      success: true,
      data: progressRecords,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: progressRecords.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get Progress History Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجل التقدم'
    });
  }
};

// الحصول على تقدم بواسطة ID
exports.getProgressById = async (req, res) => {
  try {
    const progress = await Progress.findById(req.params.id)
      .populate('subscriberId', 'name email phone birthDate emergencyContact medicalNotes avatar')
      .populate('trainerId', 'name email phone specialization experience bio avatar')
      .populate('createdBy', 'name email');

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'سجل التقدم غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'subscriber' && progress.subscriberId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا التقدم'
      });
    }

    if (req.user.role === 'trainer' && progress.trainerId?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا التقدم'
      });
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    console.error('Get Progress Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات التقدم'
    });
  }
};

// تحديث سجل التقدم
exports.updateProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // منع تحديث بعض الحقول
    delete updateData.subscriberId;
    delete updateData.trainerId;
    delete updateData.createdBy;

    const progress = await Progress.findById(id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'سجل التقدم غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'subscriber') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث سجل التقدم'
      });
    }

    // المدرب يمكنه فقط تحديث السجلات الخاصة به
    if (req.user.role === 'trainer' && progress.trainerId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا التقدم'
      });
    }

    const updatedProgress = await Progress.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('subscriberId', 'name email phone avatar')
    .populate('trainerId', 'name email phone specialization avatar');

    res.json({
      success: true,
      message: 'تم تحديث سجل التقدم بنجاح',
      data: updatedProgress
    });
  } catch (error) {
    console.error('Update Progress Error:', error);
    
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

// الحصول على إحصائيات التقدم
exports.getProgressStats = async (req, res) => {
  try {
    const { subscriberId, period = 'year' } = req.query;
    
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
        startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const query = { date: { $gte: startDate } };
    if (subscriberId) query.subscriberId = subscriberId;

    // تحديد الصلاحيات
    if (req.user.role === 'subscriber') {
      query.subscriberId = req.user.id;
    } else if (req.user.role === 'trainer') {
      query.trainerId = req.user.id;
    }

    const progressRecords = await Progress.find(query)
      .populate('subscriberId', 'name email phone avatar')
      .sort({ date: 1 });

    // تحليل البيانات للإحصائيات
    const stats = analyzeProgressData(progressRecords);

    res.json({
      success: true,
      data: {
        records: progressRecords,
        stats,
        totalRecords: progressRecords.length
      }
    });
  } catch (error) {
    console.error('Get Progress Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات التقدم'
    });
  }
};

// الحصول على التقرير الشامل
exports.getComprehensiveReport = async (req, res) => {
  try {
    const { subscriberId } = req.params;
    const { startDate, endDate } = req.query;

    // التحقق من الصلاحيات
    if (req.user.role === 'subscriber' && subscriberId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا التقرير'
      });
    }

    if (req.user.role === 'trainer') {
      // المدرب يمكنه فقط رؤية تقارير متدربيه
      const subscriber = await User.findById(subscriberId);
      if (!subscriber || !subscriber.trainerId || subscriber.trainerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'ليس لديك صلاحية لعرض تقرير هذا المتدرب'
        });
      }
    }

    const dateQuery = {};
    if (startDate) dateQuery.$gte = new Date(startDate);
    if (endDate) dateQuery.$lte = new Date(endDate);

    // جلب بيانات التقدم
    const progressQuery = { subscriberId };
    if (startDate || endDate) progressQuery.date = dateQuery;

    const progressRecords = await Progress.find(progressQuery)
      .populate('trainerId', 'name specialization')
      .sort({ date: 1 });

    // جلب الجلسات التدريبية
    const sessionsQuery = { subscriberId, status: 'completed' };
    if (startDate || endDate) sessionsQuery.date = dateQuery;

    const trainingSessions = await TrainingSession.find(sessionsQuery)
      .populate('trainerId', 'name specialization')
      .sort({ date: 1 });

    // جلب الاشتراكات
    const subscriptions = await Subscription.find({ subscriberId })
      .populate('trainerId', 'name specialization')
      .sort({ startDate: 1 });

    // تحليل البيانات
    const report = generateComprehensiveReport(progressRecords, trainingSessions, subscriptions);

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get Comprehensive Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء التقرير الشامل'
    });
  }
};

// تحديث حالة الهدف
exports.updateGoalStatus = async (req, res) => {
  try {
    const { id, goalType, goalIndex } = req.params;
    const { achieved } = req.body;

    const progress = await Progress.findById(id);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'سجل التقدم غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role !== 'trainer' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث الأهداف'
      });
    }

    const goalPath = `goals.${goalType}.${goalIndex}`;
    const updateData = {
      [`${goalPath}.achieved`]: achieved
    };

    if (achieved) {
      updateData[`${goalPath}.achievedDate`] = new Date();
    }

    const updatedProgress = await Progress.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
    .populate('subscriberId', 'name email phone avatar')
    .populate('trainerId', 'name email phone specialization avatar');

    res.json({
      success: true,
      message: `تم ${achieved ? 'تحقيق' : 'إلغاء تحقيق'} الهدف بنجاح`,
      data: updatedProgress
    });
  } catch (error) {
    console.error('Update Goal Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الهدف'
    });
  }
};

// دوال مساعدة
function analyzeProgressData(progressRecords) {
  if (progressRecords.length === 0) {
    return {
      weightChange: 0,
      performanceImprovement: 0,
      consistencyScore: 0,
      goalAchievementRate: 0
    };
  }

  const firstRecord = progressRecords[0];
  const lastRecord = progressRecords[progressRecords.length - 1];

  // تحليل الوزن
  const weightChange = firstRecord.physicalMeasurements.weight && lastRecord.physicalMeasurements.weight 
    ? lastRecord.physicalMeasurements.weight - firstRecord.physicalMeasurements.weight
    : 0;

  // تحسين الأداء (متوسط نقاط التقييم)
  const avgFirstRating = calculateAverageRating(firstRecord);
  const avgLastRating = calculateAverageRating(lastRecord);
  const performanceImprovement = avgLastRating - avgFirstRating;

  // معدل تحقيق الأهداف
  const allGoals = progressRecords.flatMap(record => [
    ...(record.goals?.shortTerm || []),
    ...(record.goals?.longTerm || [])
  ]);
  const achievedGoals = allGoals.filter(goal => goal.achieved);
  const goalAchievementRate = allGoals.length > 0 ? (achievedGoals.length / allGoals.length) * 100 : 0;

  return {
    weightChange: Math.round(weightChange * 100) / 100,
    performanceImprovement: Math.round(performanceImprovement * 100) / 100,
    consistencyScore: calculateConsistencyScore(progressRecords),
    goalAchievementRate: Math.round(goalAchievementRate * 100) / 100,
    totalGoals: allGoals.length,
    achievedGoals: achievedGoals.length,
    progressScore: lastRecord.progressScore
  };
}

function calculateAverageRating(record) {
  const ratings = [
    record.overallRating,
    record.lifestyle?.sleepQuality,
    record.lifestyle?.energyLevel,
    record.performanceMetrics?.swimming?.techniqueScore
  ].filter(rating => rating !== undefined && rating !== null);

  return ratings.length > 0 ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
}

function calculateConsistencyScore(records) {
  if (records.length < 2) return 0;

  let consistency = 0;
  for (let i = 1; i < records.length; i++) {
    const timeDiff = (records[i].date - records[i-1].date) / (1000 * 60 * 60 * 24); // أيام
    
    // نقاط إضافية للتسجيلات المنتظمة
    if (timeDiff <= 30) consistency += 2;
    else if (timeDiff <= 60) consistency += 1;
  }

  return Math.min((consistency / (records.length - 1)) * 10, 10);
}

function generateComprehensiveReport(progressRecords, trainingSessions, subscriptions) {
  const stats = analyzeProgressData(progressRecords);

  // تحليل الجلسات التدريبية
  const sessionStats = {
    totalSessions: trainingSessions.length,
    completedSessions: trainingSessions.filter(s => s.status === 'completed').length,
    avgSessionDuration: trainingSessions.length > 0 
      ? trainingSessions.reduce((sum, session) => sum + session.duration, 0) / trainingSessions.length 
      : 0,
    favoriteSessionType: getMostFrequentType(trainingSessions),
    totalTrainingHours: trainingSessions.reduce((sum, session) => sum + session.duration, 0) / 60,
    avgTechniqueScore: trainingSessions.length > 0 
      ? trainingSessions.reduce((sum, session) => sum + (session.progressMetrics?.techniqueScore || 0), 0) / trainingSessions.length 
      : 0
  };

  // تحليل الاشتراكات
  const subscriptionStats = {
    currentSubscription: subscriptions.find(sub => sub.status === 'active'),
    totalSubscriptions: subscriptions.length,
    totalInvestment: subscriptions.reduce((sum, sub) => sum + sub.price, 0),
    totalSessionsUsed: subscriptions.reduce((sum, sub) => sum + sub.usedSessions, 0),
    totalSessionsAvailable: subscriptions.reduce((sum, sub) => sum + sub.totalSessions, 0)
  };

  // التوصيات
  const recommendations = generateRecommendations(stats, sessionStats, progressRecords);

  return {
    overview: {
      period: {
        start: progressRecords.length > 0 ? progressRecords[0].date : null,
        end: progressRecords.length > 0 ? progressRecords[progressRecords.length - 1].date : null
      },
      totalProgressRecords: progressRecords.length,
      overallProgress: stats
    },
    training: sessionStats,
    subscriptions: subscriptionStats,
    milestones: identifyMilestones(progressRecords, trainingSessions),
    recommendations,
    summary: generateSummary(stats, recommendations)
  };
}

function getMostFrequentType(sessions) {
  const typeCount = {};
  sessions.forEach(session => {
    typeCount[session.type] = (typeCount[session.type] || 0) + 1;
  });
  return Object.keys(typeCount).reduce((a, b) => typeCount[a] > typeCount[b] ? a : b, '');
}

function generateRecommendations(stats, sessionStats, progressRecords) {
  const recommendations = [];

  if (stats.weightChange > 2) {
    recommendations.push({
      area: 'الوزن',
      suggestion: 'زيادة الوزن ملحوظة. قد تحتاج إلى مراجعة النظام الغذائي وزيادة النشاط الرياضي.',
      priority: 'high'
    });
  } else if (stats.weightChange < -2) {
    recommendations.push({
      area: 'الوزن',
      suggestion: 'فقدان الوزن ملحوظ. تأكد من الحصول على تغذية كافية لدعم النشاط الرياضي.',
      priority: 'high'
    });
  }

  if (sessionStats.avgSessionDuration < 45) {
    recommendations.push({
      area: 'مدة التدريب',
      suggestion: 'مدة الجلسات قصيرة. حاول زيادة مدة التدريب لتحقيق نتائج أفضل.',
      priority: 'medium'
    });
  }

  if (stats.consistencyScore < 6) {
    recommendations.push({
      area: 'الانتظام',
      suggestion: 'الانتظام في التسجيل يحتاج تحسين. حاول تسجيل التقدم أسبوعياً لمتابعة أفضل.',
      priority: 'medium'
    });
  }

  if (stats.goalAchievementRate < 50) {
    recommendations.push({
      area: 'تحقيق الأهداف',
      suggestion: 'معدل تحقيق الأهداف منخفض. ضع أهدافاً واقعية وقابلة للتحقيق.',
      priority: 'high'
    });
  }

  return recommendations;
}

function identifyMilestones(progressRecords, trainingSessions) {
  const milestones = [];

  if (progressRecords.length >= 10) {
    milestones.push('إكمال 10 تسجيلات للتقدم');
  }

  if (trainingSessions.length >= 50) {
    milestones.push('إكمال 50 جلسة تدريبية');
  }

  const weightLoss = progressRecords.length > 0 ? 
    progressRecords[0].physicalMeasurements.weight - progressRecords[progressRecords.length - 1].physicalMeasurements.weight : 0;
  
  if (weightLoss >= 5) {
    milestones.push(`خسارة ${Math.round(weightLoss)} كجم`);
  }

  return milestones;
}

function generateSummary(stats, recommendations) {
  let summary = '';

  if (stats.performanceImprovement > 0) {
    summary += 'أداؤك في تحسن مستمر. ';
  } else if (stats.performanceImprovement < 0) {
    summary += 'هناك انخفاض في الأداء. ';
  }

  if (stats.goalAchievementRate > 70) {
    summary += 'تحقق أهدافك بمعدل ممتاز. ';
  } else if (stats.goalAchievementRate < 30) {
    summary += 'تحتاج إلى العمل على تحقيق أهدافك بشكل أفضل. ';
  }

  if (recommendations.length > 0) {
    summary += 'هناك بعض المجالات التي تحتاج إلى تحسين. ';
  }

  return summary || 'أداؤك جيد بشكل عام. استمر في العمل الجاد!';
}