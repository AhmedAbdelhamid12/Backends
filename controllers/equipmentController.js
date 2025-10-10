const Equipment = require('../models/Equipment');
const TrainingSession = require('../models/TrainingSession');
const logger = require('../utils/logger');

// الحصول على جميع المعدات
exports.getAllEquipment = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      status,
      location,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (category) query.category = category;
    if (status) query.status = status;
    if (location) query.location = location;

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { type: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const equipment = await Equipment.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

    const total = await Equipment.countDocuments(query);

    res.json({
      success: true,
      data: equipment,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Equipment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المعدات'
    });
  }
};

// الحصول على معدات متاحة
exports.getAvailableEquipment = async (req, res) => {
  try {
    const { category, location } = req.query;
    const equipment = await Equipment.getAvailableEquipment(category, location);

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    logger.error('Get Available Equipment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المعدات المتاحة'
    });
  }
};

// الحصول على معدات تحتاج صيانة
exports.getMaintenanceSchedule = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const equipment = await Equipment.getMaintenanceSchedule(parseInt(days));

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    logger.error('Get Maintenance Schedule Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب جدول الصيانة'
    });
  }
};

// الحصول على معدات بواسطة ID
exports.getEquipmentById = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id)
      .populate('usageHistory.sessionId', 'date status')
      .populate('usageHistory.userId', 'name email')
      .populate('usageHistory.coachId', 'name email');

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'المعدة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: equipment
    });
  } catch (error) {
    logger.error('Get Equipment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب المعدة'
    });
  }
};

// إنشاء معدات جديدة
exports.createEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.create(req.body);

    logger.info(`Equipment created: ${equipment.name} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المعدة بنجاح',
      data: equipment
    });
  } catch (error) {
    logger.error('Create Equipment Error:', error);
    
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
      message: 'خطأ في إنشاء المعدة'
    });
  }
};

// تحديث معدات
exports.updateEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'المعدة غير موجودة'
      });
    }

    logger.info(`Equipment updated: ${equipment.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تحديث المعدة بنجاح',
      data: equipment
    });
  } catch (error) {
    logger.error('Update Equipment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث المعدة'
    });
  }
};

// حذف معدات
exports.deleteEquipment = async (req, res) => {
  try {
    const equipment = await Equipment.findById(req.params.id);

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'المعدة غير موجودة'
      });
    }

    // حذف ناعم
    equipment.status = 'retired';
    equipment.retiredAt = new Date();
    await equipment.save();

    logger.info(`Equipment deleted: ${equipment.name} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم حذف المعدة بنجاح'
    });
  } catch (error) {
    logger.error('Delete Equipment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المعدة'
    });
  }
};

// حجز معدات
exports.reserveEquipment = async (req, res) => {
  try {
    const { equipmentIds, quantity = 1, sessionId } = req.body;

    const equipmentList = await Equipment.find({
      _id: { $in: equipmentIds }
    });

    const unavailable = equipmentList.filter(
      eq => !eq.checkAvailability(quantity)
    );

    if (unavailable.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'بعض المعدات غير متاحة',
        unavailable: unavailable.map(eq => ({
          id: eq._id,
          name: eq.name,
          available: eq.availableQuantity
        }))
      });
    }

    // حجز المعدات
    equipmentList.forEach(eq => {
      eq.reserve(quantity);
      eq.save();
    });

    res.json({
      success: true,
      message: 'تم حجز المعدات بنجاح',
      data: equipmentList
    });
  } catch (error) {
    logger.error('Reserve Equipment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حجز المعدات'
    });
  }
};

// إطلاق معدات
exports.releaseEquipment = async (req, res) => {
  try {
    const { equipmentIds, quantity = 1 } = req.body;

    const equipmentList = await Equipment.find({
      _id: { $in: equipmentIds }
    });

    equipmentList.forEach(eq => {
      eq.release(quantity);
      eq.save();
    });

    res.json({
      success: true,
      message: 'تم إطلاق المعدات بنجاح'
    });
  } catch (error) {
    logger.error('Release Equipment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إطلاق المعدات'
    });
  }
};

// تسجيل استخدام معدات
exports.recordUsage = async (req, res) => {
  try {
    const { equipmentId, sessionId, userId, coachId, duration, notes } = req.body;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'المعدة غير موجودة'
      });
    }

    equipment.recordUsage(sessionId, userId, coachId, duration, notes);
    await equipment.save();

    res.json({
      success: true,
      message: 'تم تسجيل استخدام المعدة بنجاح',
      data: equipment
    });
  } catch (error) {
    logger.error('Record Usage Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الاستخدام'
    });
  }
};

// جدولة صيانة
exports.scheduleMaintenance = async (req, res) => {
  try {
    const {
      equipmentId,
      type,
      description,
      cost,
      performedBy,
      nextServiceDate
    } = req.body;

    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'المعدة غير موجودة'
      });
    }

    equipment.scheduleMaintenance(type, description, cost, performedBy, nextServiceDate);
    await equipment.save();

    res.json({
      success: true,
      message: 'تم جدولة الصيانة بنجاح',
      data: equipment
    });
  } catch (error) {
    logger.error('Schedule Maintenance Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جدولة الصيانة'
    });
  }
};

// إحصائيات المعدات
exports.getEquipmentStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    const [
      totalEquipment,
      byStatus,
      byCategory,
      usageStats,
      maintenanceNeeded
    ] = await Promise.all([
      Equipment.countDocuments(),
      Equipment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Equipment.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            available: {
              $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
            }
          }
        }
      ]),
      Equipment.getUsageStats(period),
      Equipment.countDocuments({
        $or: [
          { requiresMaintenance: true },
          { nextMaintenanceDate: { $lte: new Date() } }
        ]
      })
    ]);

    res.json({
      success: true,
      data: {
        total: totalEquipment,
        byStatus,
        byCategory,
        usageStats,
        maintenanceNeeded,
        period
      }
    });
  } catch (error) {
    logger.error('Get Equipment Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات'
    });
  }
};

