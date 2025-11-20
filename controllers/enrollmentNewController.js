const EnrollmentNew = require('../models/EnrollmentNew');
const CourseNew = require('../models/CourseNew');
const UserNew = require('../models/UserNew');

// Get enrollments
exports.getEnrollments = async (req, res) => {
  try {
    const query = {};
    
    // Regular users can only see their own enrollments
    // Admins can see all enrollments
    if (req.user.role !== 'admin') {
      query.userId = req.user.id;
    }

    const enrollments = await EnrollmentNew.find(query)
      .populate('userId', 'name email')
      .populate('courseId', 'title slug')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { enrollments }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching enrollments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create enrollment
exports.createEnrollment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.user.id;

    // Check if course exists
    const course = await CourseNew.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is already enrolled
    const existingEnrollment = await EnrollmentNew.findOne({ userId, courseId });
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await EnrollmentNew.create({
      userId,
      courseId,
      status: 'active'
    });

    // Populate references
    await enrollment.populate('userId', 'name email');
    await enrollment.populate('courseId', 'title slug');

    res.status(201).json({
      success: true,
      message: 'Enrollment created successfully',
      data: { enrollment }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating enrollment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};