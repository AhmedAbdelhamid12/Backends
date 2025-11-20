const CourseNew = require('../models/CourseNew');
const EnrollmentNew = require('../models/EnrollmentNew');

// Get all courses with pagination and search
exports.getCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const skip = (page - 1) * limit;

    // Build search query
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Only show published courses to non-admin users
    if (req.user && req.user.role !== 'admin') {
      query.published = true;
    }

    const courses = await CourseNew.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await CourseNew.countDocuments(query);

    res.json({
      success: true,
      data: {
        courses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching courses',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get course by slug
exports.getCourseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const course = await CourseNew.findOne({ slug });
    
    // Only show unpublished courses to admin users
    if (!course || (!course.published && (!req.user || req.user.role !== 'admin'))) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      data: { course }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create course (admin only)
exports.createCourse = async (req, res) => {
  try {
    const { title, slug, description, price, published } = req.body;

    const course = await CourseNew.create({
      title,
      slug,
      description,
      price,
      published: published || false
    });

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: { course }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course with this slug already exists'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error creating course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update course (admin only)
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, price, published } = req.body;

    const course = await CourseNew.findByIdAndUpdate(
      id,
      { title, slug, description, price, published },
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    res.json({
      success: true,
      message: 'Course updated successfully',
      data: { course }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Course with this slug already exists'
      });
    }

    res.status(500).json({ 
      success: false,
      message: 'Error updating course',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};