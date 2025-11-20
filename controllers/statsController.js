const mongoose = require('mongoose');

// Get overview statistics
exports.getOverview = async (req, res) => {
  try {
    // Get all necessary models
    const User = require('../models/User');
    const Subscription = require('../models/Subscription');
    const Course = require('../models/Course');

    // Count total users
    const totalUsers = await User.countDocuments();

    // Count active enrollments/subscriptions
    const activeEnrollments = await Subscription.countDocuments({ status: 'active' });

    // Calculate revenue this month
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const revenueThisMonth = 0; // Placeholder - adjust based on your payment model

    // Calculate monthly growth
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = monthStart;
    
    let monthlyGrowth = 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeEnrollments,
        revenueThisMonth,
        monthlyGrowth,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Stats overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch overview statistics',
      error: error.message
    });
  }
};

// Get monthly statistics
exports.getMonthlyStats = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Placeholder implementation
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      monthlyData.push({
        month,
        revenue: 0,
        newUsers: 0,
        activeUsers: 0
      });
    }

    res.json({
      success: true,
      data: {
        year: targetYear,
        monthlyData
      }
    });
  } catch (error) {
    console.error('Monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly statistics',
      error: error.message
    });
  }
};

// Get user growth statistics
exports.getUserGrowth = async (req, res) => {
  try {
    const User = require('../models/User');
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Placeholder implementation
    const growthData = [];
    for (let month = 1; month <= 12; month++) {
      growthData.push({
        month,
        newUsers: 0,
        totalUsers: 0
      });
    }

    res.json({
      success: true,
      data: {
        year: targetYear,
        growthData
      }
    });
  } catch (error) {
    console.error('User growth stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user growth statistics',
      error: error.message
    });
  }
};

// Get course performance statistics
exports.getCoursePerformance = async (req, res) => {
  try {
    const Course = require('../models/Course');
    const Subscription = require('../models/Subscription');

    // Get all courses with enrollment data
    const courses = await Course.find().select('title description price');
    
    const performance = await Promise.all(
      courses.map(async (course) => {
        const enrollmentCount = await Subscription.countDocuments({
          courseId: course._id
        });

        return {
          courseId: course._id,
          title: course.title,
          enrollmentCount,
          revenue: (enrollmentCount * (course.price || 0))
        };
      })
    );

    res.json({
      success: true,
      data: {
        courses: performance.sort((a, b) => b.enrollmentCount - a.enrollmentCount)
      }
    });
  } catch (error) {
    console.error('Course performance stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course performance statistics',
      error: error.message
    });
  }
};
