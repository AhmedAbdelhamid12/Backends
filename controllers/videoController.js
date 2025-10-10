const Video = require('../models/Video');
const logger = require('../utils/logger');

// الحصول على جميع الفيديوهات
exports.getAllVideos = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      level,
      accessLevel,
      search,
      featured,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = { status: 'published' };

    if (category) query.category = category;
    if (level) query.level = level;
    if (accessLevel) query.accessLevel = accessLevel;
    if (featured === 'true') query.isFeatured = true;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // التحقق من صلاحيات الوصول
    if (req.user.role !== 'admin' && query.accessLevel === 'premium') {
      // يمكن إضافة منطق للتحقق من الاشتراك المميز
    }

    const videos = await Video.find(query)
      .populate('uploadedBy', 'name email')
      .populate('coachId', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 });

    const total = await Video.countDocuments(query);

    res.json({
      success: true,
      data: videos,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total
      }
    });
  } catch (error) {
    logger.error('Get Videos Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفيديوهات'
    });
  }
};

// الحصول على فيديوهات مميزة
exports.getFeaturedVideos = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const videos = await Video.getFeaturedVideos(parseInt(limit));

    res.json({
      success: true,
      data: videos
    });
  } catch (error) {
    logger.error('Get Featured Videos Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفيديوهات المميزة'
    });
  }
};

// الحصول على فيديو بواسطة ID
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate('uploadedBy', 'name email profileImage')
      .populate('coachId', 'name email')
      .populate('comments.userId', 'name email profileImage');

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'الفيديو غير موجود'
      });
    }

    // تسجيل المشاهدة
    video.recordView(req.user._id);
    await video.save();

    res.json({
      success: true,
      data: video
    });
  } catch (error) {
    logger.error('Get Video Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الفيديو'
    });
  }
};

// إنشاء فيديو جديد
exports.createVideo = async (req, res) => {
  try {
    const videoData = {
      ...req.body,
      uploadedBy: req.user._id
    };

    const video = await Video.create(videoData);

    logger.info(`Video created: ${video.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء الفيديو بنجاح',
      data: video
    });
  } catch (error) {
    logger.error('Create Video Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إنشاء الفيديو'
    });
  }
};

// تحديث فيديو
exports.updateVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'الفيديو غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (video.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لتحديث هذا الفيديو'
      });
    }

    Object.assign(video, req.body);
    await video.save();

    res.json({
      success: true,
      message: 'تم تحديث الفيديو بنجاح',
      data: video
    });
  } catch (error) {
    logger.error('Update Video Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الفيديو'
    });
  }
};

// حذف فيديو
exports.deleteVideo = async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'الفيديو غير موجود'
      });
    }

    // التحقق من الصلاحيات
    if (video.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'ليس لديك صلاحية لحذف هذا الفيديو'
      });
    }

    video.status = 'archived';
    await video.save();

    res.json({
      success: true,
      message: 'تم حذف الفيديو بنجاح'
    });
  } catch (error) {
    logger.error('Delete Video Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف الفيديو'
    });
  }
};

// تحديث وقت المشاهدة
exports.updateWatchTime = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { watchTime, completed } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'الفيديو غير موجود'
      });
    }

    video.updateWatchTime(req.user._id, watchTime, completed);
    await video.save();

    res.json({
      success: true,
      message: 'تم تحديث وقت المشاهدة بنجاح'
    });
  } catch (error) {
    logger.error('Update Watch Time Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث وقت المشاهدة'
    });
  }
};

// إضافة تعليق
exports.addComment = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { comment } = req.body;

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'الفيديو غير موجود'
      });
    }

    video.addComment(req.user._id, comment);
    await video.save();

    res.json({
      success: true,
      message: 'تم إضافة التعليق بنجاح',
      data: video
    });
  } catch (error) {
    logger.error('Add Comment Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إضافة التعليق'
    });
  }
};

