const Academy = require('../models/Academy');
const logger = require('../utils/logger');

// الحصول على جميع الأكاديميات
exports.getAcademies = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sport,
      search
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (sport) query.sports = sport;
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const academies = await Academy.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Academy.countDocuments(query);

    res.json({
      success: true,
      data: academies,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Academies Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأكاديميات'
    });
  }
};

// الحصول على أكاديمية واحدة
exports.getAcademyById = async (req, res) => {
  try {
    const academy = await Academy.findById(req.params.id).populate('owner', 'name email');

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: 'الأكاديمية غير موجودة'
      });
    }

    res.json({ success: true, data: academy });
  } catch (error) {
    logger.error('Get Academy Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأكاديمية'
    });
  }
};

// إنشاء أكاديمية جديدة
exports.createAcademy = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      owner: req.body.owner || req.user?._id
    };

    const academy = await Academy.create(payload);

    logger.info(`Academy created: ${academy.name} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الأكاديمية بنجاح',
      data: academy
    });
  } catch (error) {
    logger.error('Create Academy Error:', error);

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
      message: 'خطأ في إنشاء الأكاديمية'
    });
  }
};

// تحديث أكاديمية
exports.updateAcademy = async (req, res) => {
  try {
    const academy = await Academy.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: 'الأكاديمية غير موجودة'
      });
    }

    logger.info(`Academy updated: ${academy.name} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'تم تحديث الأكاديمية بنجاح',
      data: academy
    });
  } catch (error) {
    logger.error('Update Academy Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الأكاديمية'
    });
  }
};

// حذف أكاديمية (حذف ناعم)
exports.deleteAcademy = async (req, res) => {
  try {
    const academy = await Academy.findById(req.params.id);

    if (!academy) {
      return res.status(404).json({
        success: false,
        message: 'الأكاديمية غير موجودة'
      });
    }

    academy.status = 'inactive';
    await academy.save();

    logger.info(`Academy deleted: ${academy.name} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'تم إيقاف الأكاديمية بنجاح'
    });
  } catch (error) {
    logger.error('Delete Academy Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الأكاديمية'
    });
  }
};

