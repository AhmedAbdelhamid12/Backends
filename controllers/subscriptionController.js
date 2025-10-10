// controllers/subscriptionController.js
const Subscription = require('../models/Subscription');
const User = require('../models/User');

// إنشاء اشتراك جديد
exports.createSubscription = async (req, res) => {
  try {
    const {
      subscriberId,
      planType,
      planName,
      startDate,
      endDate,
      price,
      sessionsPerWeek,
      totalSessions,
      trainerId,
      paymentMethod,
      autoRenew,
      notes
    } = req.body;

    // التحقق من وجود المشترك
    const subscriber = await User.findById(subscriberId);
    if (!subscriber || subscriber.role !== 'subscriber') {
      return res.status(404).json({
        success: false,
        message: 'المشترك غير موجود'
      });
    }

    // التحقق من المدرب إذا تم تحديده
    if (trainerId) {
      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== 'trainer') {
        return res.status(404).json({
          success: false,
          message: 'المدرب غير موجود'
        });
      }
    }

    // حساب تاريخ التجديد (قبل الانتهاء بـ3 أيام)
    const renewalDate = new Date(endDate);
    renewalDate.setDate(renewalDate.getDate() - 3);

    const subscription = await Subscription.create({
      subscriberId,
      planType,
      planName,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      renewalDate,
      price,
      sessionsPerWeek,
      totalSessions,
      trainerId,
      paymentMethod,
      autoRenew,
      notes,
      createdBy: req.user.id,
      status: 'active',
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid'
    });

    // تحديث علاقة المدرب مع المتدرب إذا كان هناك مدرب
    if (trainerId) {
      await User.findByIdAndUpdate(trainerId, {
        $addToSet: { trainees: subscriberId }
      });
    }

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الاشتراك بنجاح',
      data: subscription
    });
  } catch (error) {
    console.error('Create Subscription Error:', error);
    
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
      message: 'خطأ في إنشاء الاشتراك'
    });
  }
};

// الحصول على جميع الاشتراكات
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      planType, 
      subscriberId,
      trainerId,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    
    if (status) query.status = status;
    if (planType) query.planType = planType;
    if (subscriberId) query.subscriberId = subscriberId;
    if (trainerId) query.trainerId = trainerId;

    // تحديد الصلاحيات
    if (req.user.role === 'subscriber') {
      query.subscriberId = req.user.id;
    } else if (req.user.role === 'trainer') {
      query.trainerId = req.user.id;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const subscriptions = await Subscription.find(query)
      .populate('subscriberId', 'name email phone')
      .populate('trainerId', 'name email phone specialization')
      .populate('createdBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort);

    const total = await Subscription.countDocuments(query);

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: subscriptions.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get Subscriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الاشتراكات'
    });
  }
};

// الحصول على اشتراك بواسطة ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate('subscriberId', 'name email phone birthDate emergencyContact')
      .populate('trainerId', 'name email phone specialization experience')
      .populate('createdBy', 'name email');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'subscriber' && subscription.subscriberId._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا الاشتراك'
      });
    }

    if (req.user.role === 'trainer' && subscription.trainerId?._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا الاشتراك'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Get Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات الاشتراك'
    });
  }
};

// تحديث الاشتراك
exports.updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // منع تحديث بعض الحقول
    delete updateData.subscriberId;
    delete updateData.createdBy;

    const subscription = await Subscription.findById(id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role === 'subscriber') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث الاشتراك'
      });
    }

    // إذا كان مدرب، يمكنه فقط تحديث الاشتراكات الخاصة به
    if (req.user.role === 'trainer' && subscription.trainerId?.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا الاشتراك'
      });
    }

    // إذا تم تحديث المدرب، تحديث العلاقات
    if (updateData.trainerId && updateData.trainerId !== subscription.trainerId?.toString()) {
      // إزالة المتدرب من المدرب القديم
      if (subscription.trainerId) {
        await User.findByIdAndUpdate(subscription.trainerId, {
          $pull: { trainees: subscription.subscriberId }
        });
      }

      // إضافة المتدرب للمدرب الجديد
      await User.findByIdAndUpdate(updateData.trainerId, {
        $addToSet: { trainees: subscription.subscriberId }
      });
    }

    // إذا تم تحديث تاريخ الانتهاء، إعادة حساب تاريخ التجديد
    if (updateData.endDate) {
      updateData.renewalDate = new Date(updateData.endDate);
      updateData.renewalDate.setDate(updateData.renewalDate.getDate() - 3);
    }

    const updatedSubscription = await Subscription.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('subscriberId trainerId createdBy');

    res.json({
      success: true,
      message: 'تم تحديث الاشتراك بنجاح',
      data: updatedSubscription
    });
  } catch (error) {
    console.error('Update Subscription Error:', error);
    
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
      message: 'خطأ في تحديث الاشتراك'
    });
  }
};

// تجديد الاشتراك
exports.renewSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEndDate, price, notes } = req.body;

    const subscription = await Subscription.findById(id);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    if (subscription.status !== 'active' && subscription.status !== 'expired') {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن تجديد هذا الاشتراك'
      });
    }

    // إنشاء اشتراك جديد بناءً على القديم
    const newSubscription = await Subscription.create({
      subscriberId: subscription.subscriberId,
      planType: subscription.planType,
      planName: subscription.planName,
      startDate: new Date(),
      endDate: new Date(newEndDate),
      renewalDate: new Date(new Date(newEndDate).setDate(new Date(newEndDate).getDate() - 3)),
      price: price || subscription.price,
      sessionsPerWeek: subscription.sessionsPerWeek,
      totalSessions: subscription.totalSessions,
      trainerId: subscription.trainerId,
      paymentMethod: subscription.paymentMethod,
      autoRenew: subscription.autoRenew,
      notes: notes || `تم التجديد من الاشتراك السابق ${subscription._id}`,
      createdBy: req.user.id,
      status: 'active',
      paymentStatus: 'pending'
    });

    // تعطيل الاشتراك القديم
    await Subscription.findByIdAndUpdate(id, { 
      status: 'expired',
      autoRenew: false
    });

    res.json({
      success: true,
      message: 'تم تجديد الاشتراك بنجاح',
      data: newSubscription
    });
  } catch (error) {
    console.error('Renew Subscription Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تجديد الاشتراك'
    });
  }
};

// الحصول على الاشتراكات المنتهية قريباً
exports.getExpiringSubscriptions = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const date = new Date();
    date.setDate(date.getDate() + days);

    const query = {
      renewalDate: { $lte: date },
      status: 'active',
      autoRenew: false
    };

    // تحديد الصلاحيات
    if (req.user.role === 'trainer') {
      query.trainerId = req.user.id;
    } else if (req.user.role === 'subscriber') {
      query.subscriberId = req.user.id;
    }

    const subscriptions = await Subscription.find(query)
      .populate('subscriberId', 'name email phone')
      .populate('trainerId', 'name email phone')
      .sort({ renewalDate: 1 });

    res.json({
      success: true,
      data: subscriptions,
      count: subscriptions.length
    });
  } catch (error) {
    console.error('Get Expiring Subscriptions Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الاشتراكات المنتهية'
    });
  }
};

// إحصائيات الاشتراكات
exports.getSubscriptionStats = async (req, res) => {
  try {
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    const expiredSubscriptions = await Subscription.countDocuments({ status: 'expired' });
    
    const revenueStats = await Subscription.aggregate([
      { $match: { paymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          averagePrice: { $avg: '$price' }
        }
      }
    ]);

    const subscriptionsByPlan = await Subscription.aggregate([
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      }
    ]);

    const monthlyRevenue = await Subscription.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$price' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        totalSubscriptions,
        activeSubscriptions,
        expiredSubscriptions,
        totalRevenue: revenueStats[0]?.totalRevenue || 0,
        averagePrice: revenueStats[0]?.averagePrice || 0,
        subscriptionsByPlan,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Get Subscription Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الاشتراكات'
    });
  }
};

// تحديث حالة الدفع
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus, paymentMethod } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      id,
      { 
        paymentStatus,
        paymentMethod: paymentMethod || 'cash'
      },
      { new: true }
    ).populate('subscriberId trainerId');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'الاشتراك غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث حالة الدفع بنجاح',
      data: subscription
    });
  } catch (error) {
    console.error('Update Payment Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة الدفع'
    });
  }
};