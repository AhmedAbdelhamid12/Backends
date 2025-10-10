const Event = require('../models/Event');
const User = require('../models/User');
const { createNotification } = require('./notificationController');
const logger = require('../utils/logger');

// الحصول على جميع الأحداث
exports.getAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      category,
      search,
      upcoming,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (category) query.category = category;

    if (upcoming === 'true') {
      query.startDate = { $gt: new Date() };
      query.status = { $in: ['published', 'registration_open'] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const events = await Event.find(query)
      .populate('participants.userId', 'name email')
      .populate('organizers.userId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 });

    const total = await Event.countDocuments(query);

    res.json({
      success: true,
      data: events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Events Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأحداث'
    });
  }
};

// الحصول على الأحداث القادمة
exports.getUpcomingEvents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const events = await Event.getUpcomingEvents(parseInt(limit));

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get Upcoming Events Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأحداث القادمة'
    });
  }
};

// الحصول على الأحداث الجارية
exports.getOngoingEvents = async (req, res) => {
  try {
    const events = await Event.getOngoingEvents();

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    logger.error('Get Ongoing Events Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الأحداث الجارية'
    });
  }
};

// الحصول على حدث بواسطة ID
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('participants.userId', 'name email phone profileImage')
      .populate('organizers.userId', 'name email phone')
      .populate('competitions.registeredSwimmers.userId', 'name email')
      .populate('competitions.results.userId', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'الحدث غير موجود'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    logger.error('Get Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الحدث'
    });
  }
};

// إنشاء حدث جديد
exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);

    logger.info(`Event created: ${event.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحدث بنجاح',
      data: event
    });
  } catch (error) {
    logger.error('Create Event Error:', error);
    
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
      message: 'خطأ في إنشاء الحدث'
    });
  }
};

// تحديث حدث
exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'الحدث غير موجود'
      });
    }

    logger.info(`Event updated: ${event.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم تحديث الحدث بنجاح',
      data: event
    });
  } catch (error) {
    logger.error('Update Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الحدث'
    });
  }
};

// حذف حدث
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'الحدث غير موجود'
      });
    }

    // حذف ناعم
    event.status = 'cancelled';
    event.cancelledAt = new Date();
    await event.save();

    logger.info(`Event deleted: ${event.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'تم حذف الحدث بنجاح'
    });
  } catch (error) {
    logger.error('Delete Event Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الحدث'
    });
  }
};

// تسجيل مشارك في حدث
exports.registerParticipant = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { category, notes } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'الحدث غير موجود'
      });
    }

    event.registerParticipant(userId, category, notes);
    await event.save();

    // إرسال إشعار
    await createNotification(
      userId,
      'تم تسجيلك في الحدث',
      `تم تسجيلك في الحدث: ${event.title}`,
      {
        type: 'success',
        category: 'event',
        actionUrl: `/events/${eventId}`
      }
    );

    res.json({
      success: true,
      message: 'تم التسجيل في الحدث بنجاح',
      data: event
    });
  } catch (error) {
    logger.error('Register Participant Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'خطأ في التسجيل'
    });
  }
};

// إلغاء تسجيل مشارك
exports.cancelRegistration = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user._id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'الحدث غير موجود'
      });
    }

    event.cancelRegistration(userId);
    await event.save();

    res.json({
      success: true,
      message: 'تم إلغاء التسجيل بنجاح'
    });
  } catch (error) {
    logger.error('Cancel Registration Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'خطأ في إلغاء التسجيل'
    });
  }
};

// تسجيل نتيجة مسابقة
exports.recordCompetitionResult = async (req, res) => {
  try {
    const { eventId, competitionIndex } = req.params;
    const { userId, time, position, points, disqualified, reason } = req.body;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'الحدث غير موجود'
      });
    }

    event.recordResult(competitionIndex, userId, time, position, points, disqualified, reason);
    await event.save();

    res.json({
      success: true,
      message: 'تم تسجيل النتيجة بنجاح',
      data: event
    });
  } catch (error) {
    logger.error('Record Result Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'خطأ في تسجيل النتيجة'
    });
  }
};

// إحصائيات الأحداث
exports.getEventStats = async (req, res) => {
  try {
    const [
      totalEvents,
      byType,
      byStatus,
      upcomingCount,
      totalParticipants
    ] = await Promise.all([
      Event.countDocuments(),
      Event.aggregate([
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 }
          }
        }
      ]),
      Event.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      Event.countDocuments({
        startDate: { $gt: new Date() },
        status: { $in: ['published', 'registration_open'] }
      }),
      Event.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$stats.totalParticipants' }
          }
        }
      ])
    ]);

    res.json({
      success: true,
      data: {
        total: totalEvents,
        byType,
        byStatus,
        upcoming: upcomingCount,
        totalParticipants: totalParticipants[0]?.total || 0
      }
    });
  } catch (error) {
    logger.error('Get Event Stats Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإحصائيات'
    });
  }
};

