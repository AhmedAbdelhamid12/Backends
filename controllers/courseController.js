const Course = require('../models/Course');
const { createNotification } = require('./notificationController');
const logger = require('../utils/logger');

// الحصول على جميع البرامج
exports.getAllCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      level,
      status,
      coachId,
      search,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (level) query.level = level;
    if (status) query.status = status;
    if (coachId) query.coachId = coachId;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('coachId', 'name email specialization')
      .populate('participants.userId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: courses,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Courses Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب البرامج'
    });
  }
};

// الحصول على البرامج المتاحة
exports.getAvailableCourses = async (req, res) => {
  try {
    const { category, level } = req.query;
    const courses = await Course.getAvailableCourses(category, level);

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    logger.error('Get Available Courses Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب البرامج المتاحة'
    });
  }
};

// الحصول على برنامج بواسطة ID
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('coachId', 'name email specialization experience')
      .populate('assistantCoaches.userId', 'name email')
      .populate('participants.userId', 'name email phone profileImage')
      .populate('waitlist.userId', 'name email');

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'البرنامج غير موجود'
      });
    }

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    logger.error('Get Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب البرنامج'
    });
  }
};

// إنشاء برنامج جديد
exports.createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);

    logger.info(`Course created: ${course.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء البرنامج بنجاح',
      data: course
    });
  } catch (error) {
    logger.error('Create Course Error:', error);
    
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
      message: 'خطأ في إنشاء البرنامج'
    });
  }
};

// تحديث برنامج
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'البرنامج غير موجود'
      });
    }

    logger.info(`Course updated: ${course.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تحديث البرنامج بنجاح',
      data: course
    });
  } catch (error) {
    logger.error('Update Course Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث البرنامج'
    });
  }
};

// تسجيل في برنامج
exports.enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'البرنامج غير موجود'
      });
    }

    course.enrollParticipant(userId);
    await course.save();

    await createNotification(
      userId,
      'تم تسجيلك في البرنامج',
      `تم تسجيلك في البرنامج: ${course.name}`,
      {
        type: 'success',
        category: 'course',
        actionUrl: `/courses/${courseId}`
      }
    );

    res.json({
      success: true,
      message: 'تم التسجيل في البرنامج بنجاح',
      data: course
    });
  } catch (error) {
    logger.error('Enroll Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'خطأ في التسجيل'
    });
  }
};

// تحديث تقدم في برنامج
exports.updateProgress = async (req, res) => {
  try {
    const { courseId, userId } = req.params;
    const { progress } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'البرنامج غير موجود'
      });
    }

    course.updateProgress(userId, progress);
    await course.save();

    res.json({
      success: true,
      message: 'تم تحديث التقدم بنجاح',
      data: course
    });
  } catch (error) {
    logger.error('Update Progress Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'خطأ في تحديث التقدم'
    });
  }
};

// إحصائيات البرامج
exports.getCourseStats = async (req, res) => {
  try {
    const [
      totalCourses,
      byCategory,
      byStatus,
      totalEnrollments
    ] = await Promise.all([
      Course.countDocuments(),
      Course.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]),
      Course.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Course.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$currentParticipants' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalCourses,
        byCategory,
        byStatus,
        totalEnrollments: totalEnrollments[0]?.total || 0
      }
    });
  } catch (error) {
    logger.error('Get Course Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات'
    });
  }
};

