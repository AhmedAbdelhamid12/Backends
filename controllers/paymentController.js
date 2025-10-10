const Payment = require('../models/Payment');
const logger = require('../utils/logger');

// جميع المدفوعات (للأدمن)
exports.getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      user,
      academy,
      status
    } = req.query;

    const query = {};
    if (user) query.user = user;
    if (academy) query.academy = academy;
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('user', 'name email')
      .populate('academy', 'name')
      .populate('subscription', 'type status')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Payments Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المدفوعات'
    });
  }
};

// مدفوعات المستخدم الحالي
exports.getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({ success: true, data: payments });
  } catch (error) {
    logger.error('Get My Payments Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المدفوعات'
    });
  }
};

// الحصول على دفعة واحدة
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email')
      .populate('academy', 'name')
      .populate('subscription', 'type status');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'الدفعة غير موجودة'
      });
    }

    res.json({ success: true, data: payment });
  } catch (error) {
    logger.error('Get Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الدفعة'
    });
  }
};

// إنشاء دفعة (تسجيل فقط، لا يتعامل مع بوابات الدفع)
exports.createPayment = async (req, res) => {
  try {
    const payment = await Payment.create(req.body);

    logger.info(`Payment created: ${payment._id} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'تم تسجيل الدفعة بنجاح',
      data: payment
    });
  } catch (error) {
    logger.error('Create Payment Error:', error);

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
      message: 'خطأ في تسجيل الدفعة'
    });
  }
};

// تحديث حالة دفعة
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'الدفعة غير موجودة'
      });
    }

    logger.info(`Payment status updated: ${payment._id} -> ${status} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'تم تحديث حالة الدفعة بنجاح',
      data: payment
    });
  } catch (error) {
    logger.error('Update Payment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الدفعة'
    });
  }
};

