const Team = require('../models/Team');
const logger = require('../utils/logger');

// الحصول على جميع الفرق
exports.getTeams = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      academy,
      coach,
      sport,
      status
    } = req.query;

    const query = {};
    if (academy) query.academy = academy;
    if (coach) query.coach = coach;
    if (sport) query.sport = sport;
    if (status) query.status = status;

    const teams = await Team.find(query)
      .populate('coach', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Team.countDocuments(query);

    res.json({
      success: true,
      data: teams,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Teams Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفرق'
    });
  }
};

// الحصول على فريق
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('coach', 'name email')
      .populate('members.trainee', 'name email');

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'الفريق غير موجود'
      });
    }

    res.json({ success: true, data: team });
  } catch (error) {
    logger.error('Get Team Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفريق'
    });
  }
};

// إنشاء فريق جديد
exports.createTeam = async (req, res) => {
  try {
    const team = await Team.create(req.body);

    logger.info(`Team created: ${team.name} by ${req.user?.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفريق بنجاح',
      data: team
    });
  } catch (error) {
    logger.error('Create Team Error:', error);

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
      message: 'خطأ في إنشاء الفريق'
    });
  }
};

// تحديث فريق
exports.updateTeam = async (req, res) => {
  try {
    const team = await Team.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'الفريق غير موجود'
      });
    }

    logger.info(`Team updated: ${team.name} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'تم تحديث الفريق بنجاح',
      data: team
    });
  } catch (error) {
    logger.error('Update Team Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الفريق'
    });
  }
};

// حذف فريق (حذف ناعم)
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'الفريق غير موجود'
      });
    }

    team.status = 'inactive';
    await team.save();

    logger.info(`Team deleted: ${team.name} by ${req.user?.email}`);

    res.json({
      success: true,
      message: 'تم إيقاف الفريق بنجاح'
    });
  } catch (error) {
    logger.error('Delete Team Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الفريق'
    });
  }
};

