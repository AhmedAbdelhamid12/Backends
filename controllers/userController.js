// controllers/userController.js
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const TrainingSession = require('../models/TrainingSession');

// الحصول على جميع المستخدمين (للأدمن فقط)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    const query = {};
    
    if (role) query.role = role;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: users.length,
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Get Users Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المستخدمين'
    });
  }
};

// الحصول على مستخدم بواسطة ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('children', 'name email phone')
      .populate('trainees', 'name email phone');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لعرض هذا المستخدم'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get User Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب بيانات المستخدم'
    });
  }
};

// تحديث بيانات المستخدم
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // منع تحديث بعض الحقول
    delete updateData.password;
    delete updateData.role; // لا يمكن تغيير الدور إلا من قبل الأدمن
    delete updateData.email; // لا يمكن تغيير البريد الإلكتروني

    // التحقق من الصلاحيات
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا المستخدم'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث بيانات المستخدم بنجاح',
      data: user
    });
  } catch (error) {
    console.error('Update User Error:', error);
    
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
      message: 'خطأ في تحديث المستخدم'
    });
  }
};

// تحديث حالة المستخدم (للأدمن فقط)
exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'الحالة المحددة غير صحيحة'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: `تم ${status === 'active' ? 'تفعيل' : 'إلغاء تفعيل'} المستخدم بنجاح`,
      data: user
    });
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث حالة المستخدم'
    });
  }
};

// حذف مستخدم (للأدمن فقط)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // منع حذف المستخدم إذا كان لديه اشتراكات أو جلسات
    const hasSubscriptions = await Subscription.findOne({ subscriberId: id });
    const hasTrainingSessions = await TrainingSession.findOne({ 
      $or: [{ trainerId: id }, { subscriberId: id }] 
    });

    if (hasSubscriptions || hasTrainingSessions) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن حذف المستخدم لأنه مرتبط ببيانات في النظام'
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المستخدم'
    });
  }
};

// الحصول على إحصائيات المستخدمين (للأدمن فقط)
exports.getUsersStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        usersByRole,
        recentUsers
      }
    });
  } catch (error) {
    console.error('Get Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات'
    });
  }
};

// الحصول على المدربين
exports.getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ 
      role: 'trainer', 
      status: 'active' 
    })
    .select('name email phone specialization experience bio avatar')
    .sort({ name: 1 });

    res.json({
      success: true,
      data: trainers
    });
  } catch (error) {
    console.error('Get Trainers Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المدربين'
    });
  }
};

// إضافة متدرب للمدرب
exports.addTraineeToTrainer = async (req, res) => {
  try {
    const { trainerId, traineeId } = req.body;

    const trainer = await User.findById(trainerId);
    const trainee = await User.findById(traineeId);

    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({
        success: false,
        message: 'المدرب غير موجود'
      });
    }

    if (!trainee || trainee.role !== 'subscriber') {
      return res.status(404).json({
        success: false,
        message: 'المتدرب غير موجود'
      });
    }

    // التحقق إذا كان المتدرب مضافاً بالفعل
    if (trainer.trainees.includes(traineeId)) {
      return res.status(400).json({
        success: false,
        message: 'المتدرب مضاف بالفعل لهذا المدرب'
      });
    }

    trainer.trainees.push(traineeId);
    await trainer.save();

    res.json({
      success: true,
      message: 'تم إضافة المتدرب للمدرب بنجاح',
      data: trainer
    });
  } catch (error) {
    console.error('Add Trainee Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة المتدرب'
    });
  }
};