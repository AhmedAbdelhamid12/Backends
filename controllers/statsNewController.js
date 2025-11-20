const UserNew = require('../models/UserNew');
const EnrollmentNew = require('../models/EnrollmentNew');
const CourseNew = require('../models/CourseNew');
const StatsLogNew = require('../models/StatsLogNew');

// Get overview statistics
exports.getOverview = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await UserNew.countDocuments();

    // Get active enrollments
    const activeEnrollments = await EnrollmentNew.countDocuments({ status: 'active' });

    // Get revenue this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const enrollmentsThisMonth = await EnrollmentNew.find({
      createdAt: { $gte: startOfMonth }
    }).populate('courseId', 'price');

    const revenueThisMonth = enrollmentsThisMonth.reduce((total, enrollment) => {
      return total + (enrollment.courseId ? enrollment.courseId.price : 0);
    }, 0);

    // Get monthly growth (users)
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);

    const usersThisMonth = await UserNew.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    const usersLastMonth = await UserNew.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
    });

    const monthlyGrowth = usersLastMonth > 0 
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : usersThisMonth > 0 ? 100 : 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        activeEnrollments,
        revenueThisMonth,
        monthlyGrowth
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};