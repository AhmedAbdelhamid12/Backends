const Exercise = require('../models/Exercise');
const logger = require('../utils/logger');

// الحصول على جميع التمارين
exports.getExercises = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      academy,
      category,
      search
    } = req.query;

    const query = {};
    if (academy) query.academy = academy;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const exercises = await Exercise.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Exercise.countDocuments(query);

    res.json({
      success: true,
      data: exercises,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Exercises Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب التمارين'
    });
  }
};

// الحصول على تمرين
exports.getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate('createdBy', 'name email');

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'التمرين غير موجود'
      });
    }

    res.json({ success: true, data: exercise });
  } catch (error) {
    logger.error('Get Exercise Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب التمرين'
    });
  }
};

// إنشاء تمرين
exports.createExercise = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user?._id
    };

    const exercise = await Exercise.create(payload);

    logger.info(`Exercise created: ${exercise.title} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء التمرين بنجاح',
      data: exercise
    });
  } catch (error) {
    logger.error('Create Exercise Error:', error);

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
      message: 'خطأ في إنشاء التمرين'
    });
  }
};

// تحديث تمرين
exports.updateExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'التمرين غير موجود'
      });
    }

    logger.info(`Exercise updated: ${exercise.title} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'تم تحديث التمرين بنجاح',
      data: exercise
    });
  } catch (error) {
    logger.error('Update Exercise Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث التمرين'
    });
  }
};

// حذف تمرين
exports.deleteExercise = async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndDelete(req.params.id);

    if (!exercise) {
      return res.status(404).json({
        success: false,
        message: 'التمرين غير موجود'
      });
    }

    logger.info(`Exercise deleted: ${exercise.title} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'تم حذف التمرين بنجاح'
    });
  } catch (error) {
    logger.error('Delete Exercise Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف التمرين'
    });
  }
};

