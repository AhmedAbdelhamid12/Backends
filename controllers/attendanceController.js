const Attendance = require('../models/Attendance');
const TrainingSession = require('../models/TrainingSession');
const logger = require('../utils/logger');

// الحصول على سجلات الحضور
exports.getAllAttendance = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      sessionId,
      courseId,
      status,
      startDate,
      endDate,
      sortBy = 'sessionDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (userId) query.userId = userId;
    if (sessionId) query.sessionId = sessionId;
    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    if (startDate || endDate) {
      query.sessionDate = {};
      if (startDate) query.sessionDate.$gte = new Date(startDate);
      if (endDate) query.sessionDate.$lte = new Date(endDate);
    }

    const attendance = await Attendance.find(query)
      .populate('sessionId', 'date status type duration')
      .populate('userId', 'name email phone')
      .populate('coachId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

    const total = await Attendance.countDocuments(query);

    res.json({
      success: true,
      data: attendance,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجلات الحضور'
    });
  }
};

// الحصول على حضور مستخدم
exports.getUserAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;

    const attendance = await Attendance.getUserAttendance(
      userId,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    logger.error('Get User Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب حضور المستخدم'
    });
  }
};

// الحصول على حضور جلسة
exports.getSessionAttendance = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const attendance = await Attendance.getSessionAttendance(sessionId);

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    logger.error('Get Session Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب حضور الجلسة'
    });
  }
};

// تسجيل حضور
exports.markAttendance = async (req, res) => {
  try {
    const {
      sessionId,
      userId,
      status,
      arrivalTime,
      departureTime,
      notes
    } = req.body;

    const session = await TrainingSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'الجلسة غير موجودة'
      });
    }

    // التحقق من وجود سجل سابق
    let attendance = await Attendance.findOne({ sessionId, userId });

    if (attendance) {
      // تحديث السجل الموجود
      if (status === 'present') {
        attendance.markPresent(
          arrivalTime ? new Date(arrivalTime) : null,
          departureTime ? new Date(departureTime) : null
        );
      } else {
        attendance.status = status;
      }
      attendance.notes = notes;
      attendance.checkedInBy = req.user._id;
    } else {
      // إنشاء سجل جديد
      attendance = await Attendance.create({
        sessionId,
        userId,
        coachId: session.coachId,
        courseId: session.courseId,
        sessionDate: session.date,
        scheduledStartTime: session.date,
        scheduledEndTime: session.endTime,
        status: status || 'present',
        actualArrivalTime: arrivalTime ? new Date(arrivalTime) : new Date(),
        actualDepartureTime: departureTime ? new Date(departureTime) : null,
        attendanceMethod: 'manual',
        checkedInBy: req.user._id,
        notes
      });
    }

    await attendance.save();

    res.json({
      success: true,
      message: 'تم تسجيل الحضور بنجاح',
      data: attendance
    });
  } catch (error) {
    logger.error('Mark Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تسجيل الحضور'
    });
  }
};

// تحديث حضور
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'سجل الحضور غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث الحضور بنجاح',
      data: attendance
    });
  } catch (error) {
    logger.error('Update Attendance Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الحضور'
    });
  }
};

// الموافقة على عذر
exports.approveExcuse = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'سجل الحضور غير موجود'
      });
    }

    attendance.approveExcuse(req.user._id);
    await attendance.save();

    res.json({
      success: true,
      message: 'تم الموافقة على العذر بنجاح',
      data: attendance
    });
  } catch (error) {
    logger.error('Approve Excuse Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الموافقة على العذر'
    });
  }
};

// إحصائيات الحضور
exports.getAttendanceStats = async (req, res) => {
  try {
    const { userId } = req.params;
    const { period = 'month' } = req.query;

    const stats = await Attendance.getAttendanceStats(userId, period);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Get Attendance Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الحضور'
    });
  }
};

