const NutritionPlan = require('../models/NutritionPlan');
const logger = require('../utils/logger');

// الحصول على جميع خطط التغذية (للأدمن والمدرب)
exports.getNutritionPlans = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      academy,
      user,
      status
    } = req.query;

    const query = {};
    if (academy) query.academy = academy;
    if (user) query.user = user;
    if (status) query.status = status;

    const plans = await NutritionPlan.find(query)
      .populate('user', 'name email')
      .populate('createdBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await NutritionPlan.countDocuments(query);

    res.json({
      success: true,
      data: plans,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get NutritionPlans Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب خطط التغذية'
    });
  }
};

// خطط التغذية الخاصة بالمستخدم الحالي
exports.getMyNutritionPlans = async (req, res) => {
  try {
    const plans = await NutritionPlan.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: plans });
  } catch (error) {
    logger.error('Get My NutritionPlans Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب خطط التغذية'
    });
  }
};

// الحصول على خطة
exports.getNutritionPlanById = async (req, res) => {
  try {
    const plan = await NutritionPlan.findById(req.params.id)
      .populate('user', 'name email')
      .populate('createdBy', 'name email');

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'الخطة غير موجودة'
      });
    }

    res.json({ success: true, data: plan });
  } catch (error) {
    logger.error('Get NutritionPlan Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الخطة'
    });
  }
};

// إنشاء خطة جديدة
exports.createNutritionPlan = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      createdBy: req.user._id
    };

    const plan = await NutritionPlan.create(payload);

    logger.info(`Nutrition plan created for user ${plan.user} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء خطة التغذية بنجاح',
      data: plan
    });
  } catch (error) {
    logger.error('Create NutritionPlan Error:', error);

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
      message: 'خطأ في إنشاء خطة التغذية'
    });
  }
};

// تحديث خطة
exports.updateNutritionPlan = async (req, res) => {
  try {
    const plan = await NutritionPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'الخطة غير موجودة'
      });
    }

    logger.info(`Nutrition plan updated: ${plan._id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تحديث خطة التغذية بنجاح',
      data: plan
    });
  } catch (error) {
    logger.error('Update NutritionPlan Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث خطة التغذية'
    });
  }
};

// حذف خطة
exports.deleteNutritionPlan = async (req, res) => {
  try {
    const plan = await NutritionPlan.findByIdAndDelete(req.params.id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'الخطة غير موجودة'
      });
    }

    logger.info(`Nutrition plan deleted: ${plan._id} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم حذف خطة التغذية بنجاح'
    });
  } catch (error) {
    logger.error('Delete NutritionPlan Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف خطة التغذية'
    });
  }
};

