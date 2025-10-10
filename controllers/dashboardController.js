const mongoose = require('mongoose');
const TrainingSession = require('../models/TrainingSession');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const logger = require('../utils/logger');

// الحصول على إحصائيات لوحة التحكم
exports.getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    let stats = {};

    if (userRole === 'admin') {
      stats = await getAdminDashboardStats();
    } else if (userRole === 'coach' || userRole === 'trainer') {
      stats = await getCoachDashboardStats(req.user._id);
    } else {
      stats = await getUserDashboardStats(req.user._id);
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Dashboard Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات لوحة التحكم'
    });
  }
};

// دوال مساعدة
const getAdminDashboardStats = async () => {
  const [
    totalUsers,
    activeSubscriptions,
    recentSessions,
    monthlyRevenue,
    userGrowth
  ] = await Promise.all([
    User.countDocuments(),
    Subscription.countDocuments({ status: 'active' }),
    TrainingSession.countDocuments({
      date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }),
    // حساب الإيرادات من الاشتراكات بدلاً من Payment model
    Subscription.aggregate([
      {
        $match: {
          status: 'active',
          startDate: { $lte: new Date() },
          endDate: { $gte: new Date() },
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$price', 0] } }
        }
      }
    ]),
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
  ]);

  return {
    totalUsers,
    activeSubscriptions,
    totalRevenue: monthlyRevenue[0]?.total || 0,
    totalAcademies: 1,
    recentSessions,
    newUsers: userGrowth,
    recentActivities: []
  };
};

const getCoachDashboardStats = async (coachId) => {
  const [
    totalTrainees,
    upcomingSessions,
    sessionStats,
    monthlyEarnings
  ] = await Promise.all([
    User.countDocuments({ 'coaches.coach': coachId, 'coaches.status': 'active' }),
    TrainingSession.countDocuments({
      coachId,
      date: { $gte: new Date() },
      status: 'scheduled'
    }),
    TrainingSession.aggregate([
      { $match: { coachId: coachId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: { $ifNull: ['$duration', 0] } }
        }
      }
    ]),
    // حساب الأرباح من الاشتراكات المرتبطة بالجلسات
    Subscription.aggregate([
      {
        $match: {
          status: 'active',
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      {
        $lookup: {
          from: 'trainingsessions',
          localField: 'userId',
          foreignField: 'userId',
          as: 'sessions'
        }
      },
      {
        $match: {
          'sessions.coachId': new mongoose.Types.ObjectId(coachId),
          'sessions.status': 'completed'
        }
      },
      {
        $group: {
          _id: null,
          estimatedEarnings: { $sum: { $ifNull: ['$price', 0] } }
        }
      }
    ])
  ]);

  return {
    overview: {
      totalTrainees,
      upcomingSessions,
      monthlyEarnings: monthlyEarnings[0]?.estimatedEarnings || 0
    },
    sessions: sessionStats
  };
};

const getUserDashboardStats = async (userId) => {
  const [
    activeSubscription,
    upcomingSessions,
    completedSessions,
    progressCount
  ] = await Promise.all([
    Subscription.findOne({ userId, status: 'active' }).sort({ endDate: -1 }),
    TrainingSession.countDocuments({
      userId: userId,
      date: { $gte: new Date() },
      status: 'scheduled'
    }),
    TrainingSession.countDocuments({
      userId: userId,
      status: 'completed'
    }),
    require('../models/Progress').countDocuments({ 
      $or: [
        { userId: userId },
        { subscriberId: userId }
      ]
    })
  ]);

  return {
    overview: {
      hasActiveSubscription: !!activeSubscription,
      subscriptionEndDate: activeSubscription?.endDate || null,
      upcomingSessions,
      completedSessions,
      progressEntries: progressCount
    }
  };
};