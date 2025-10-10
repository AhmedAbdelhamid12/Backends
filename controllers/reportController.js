const TrainingSession = require('../models/TrainingSession');
const Subscription = require('../models/Subscription');
const User = require('../models/User');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');

// إنشاء تقرير مخصص
exports.generateCustomReport = async (req, res) => {
  try {
    const { 
      reportType, 
      startDate, 
      endDate, 
      coachId, 
      userId,
      metrics 
    } = req.body;

    let reportData = {};

    switch (reportType) {
      case 'attendance':
        reportData = await generateAttendanceReport(startDate, endDate, coachId, userId);
        break;
      case 'revenue':
        reportData = await generateRevenueReport(startDate, endDate);
        break;
      case 'performance':
        reportData = await generatePerformanceReport(startDate, endDate, coachId);
        break;
      case 'subscriptions':
        reportData = await generateSubscriptionsReport(startDate, endDate);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'نوع التقرير غير مدعوم'
        });
    }

    res.json({
      success: true,
      data: {
        report: reportData,
        generatedAt: new Date(),
        parameters: { reportType, startDate, endDate }
      }
    });
  } catch (error) {
    logger.error('Generate Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء التقرير'
    });
  }
};

// تقرير الإيرادات
exports.getRevenueReport = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const revenueData = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: getDateRange(period).start }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
          averagePayment: { $avg: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    const summary = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: getDateRange(period).start }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          uniqueCustomers: { $addToSet: '$userId' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        revenueData,
        summary: summary[0] || { totalRevenue: 0, totalPayments: 0, uniqueCustomers: [] },
        period
      }
    });
  } catch (error) {
    logger.error('Revenue Report Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب تقرير الإيرادات'
    });
  }
};

// دوال مساعدة
const generateAttendanceReport = async (startDate, endDate, coachId, userId) => {
  const match = {
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  if (coachId) match.coachId = coachId;
  if (userId) match.userId = userId;

  const attendanceData = await TrainingSession.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalDuration: { $sum: '$duration' }
      }
    }
  ]);

  return attendanceData;
};

const generateRevenueReport = async (startDate, endDate) => {
  return await Payment.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$paymentMethod',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
};

const getDateRange = (period) => {
  const now = new Date();
  let start = new Date();

  switch (period) {
    case 'week':
      start.setDate(now.getDate() - 7);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      start.setMonth(now.getMonth() - 1);
  }

  return { start, end: now };
};