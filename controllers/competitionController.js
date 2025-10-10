const Competition = require('../models/Competition');
const logger = require('../utils/logger');

// الحصول على جميع البطولات
exports.getCompetitions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      academy,
      status
    } = req.query;

    const query = {};
    if (academy) query.academy = academy;
    if (status) query.status = status;

    const competitions = await Competition.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1 });

    const total = await Competition.countDocuments(query);

    res.json({
      success: true,
      data: competitions,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Competitions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب البطولات'
    });
  }
};

// الحصول على بطولة
exports.getCompetitionById = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate('participants.user', 'name email')
      .populate('participants.team', 'name');

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'البطولة غير موجودة'
      });
    }

    res.json({ success: true, data: competition });
  } catch (error) {
    logger.error('Get Competition Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب البطولة'
    });
  }
};

// إنشاء بطولة
exports.createCompetition = async (req, res) => {
  try {
    const competition = await Competition.create(req.body);

    logger.info(`Competition created: ${competition.name} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء البطولة بنجاح',
      data: competition
    });
  } catch (error) {
    logger.error('Create Competition Error:', error);

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
      message: 'خطأ في إنشاء البطولة'
    });
  }
};

// تحديث بطولة
exports.updateCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'البطولة غير موجودة'
      });
    }

    logger.info(`Competition updated: ${competition.name} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'تم تحديث البطولة بنجاح',
      data: competition
    });
  } catch (error) {
    logger.error('Update Competition Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث البطولة'
    });
  }
};

// حذف بطولة
exports.deleteCompetition = async (req, res) => {
  try {
    const competition = await Competition.findByIdAndDelete(req.params.id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'البطولة غير موجودة'
      });
    }

    logger.info(`Competition deleted: ${competition.name} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'تم حذف البطولة بنجاح'
    });
  } catch (error) {
    logger.error('Delete Competition Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف البطولة'
    });
  }
};

