const TrainingSession = require('../models/TrainingSession');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');

// الحصول على إحصائيات لوحة التحكم
exports.getDashboardStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    let stats = {};

    if (userRole === 'admin') {
      stats = await getAdminDashboardStats();
    } else if (userRole === 'coach') {
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
    Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]),
    User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    })
  ]);

  return {
    overview: {
      totalUsers,
      activeSubscriptions,
      recentSessions,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      newUsers: userGrowth
    }
  };
};

const getCoachDashboardStats = async (coachId) => {
  const [
    totalTrainees,
    upcomingSessions,
    sessionStats,
    monthlyEarnings
  ] = await Promise.all([
    User.countDocuments({ coaches: coachId }),
    TrainingSession.countDocuments({
      coachId,
      date: { $gte: new Date() },
      status: 'scheduled'
    }),
    TrainingSession.aggregate([
      { $match: { coachId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]),
    TrainingSession.aggregate([
      {
        $match: {
          coachId,
          date: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          status: 'completed'
        }
      },
      {
        $lookup: {
          from: 'subscriptions',
          localField: 'subscriptionId',
          foreignField: '_id',
          as: 'subscription'
        }
      },
      {
        $group: {
          _id: null,
          estimatedEarnings: { $sum: { $arrayElemAt: ['$subscription.price', 0] } }
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