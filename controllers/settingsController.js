const Settings = require('../models/Settings');
const logger = require('../utils/logger');

// الحصول على الإعدادات
exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      // إنشاء إعدادات افتراضية إذا لم تكن موجودة
      settings = await Settings.create({});
    }

    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    logger.error('Get Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب الإعدادات'
    });
  }
};

// تحديث الإعدادات
exports.updateSettings = async (req, res) => {
  try {
    const updates = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(updates);
    } else {
      settings = await Settings.findOneAndUpdate(
        {},
        updates,
        { new: true, runValidators: true }
      );
    }

    logger.info('Settings updated by admin');

    res.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح',
      data: { settings }
    });
  } catch (error) {
    logger.error('Update Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الإعدادات'
    });
  }
};

// إعادة تعيين الإعدادات
exports.resetSettings = async (req, res) => {
  try {
    await Settings.deleteMany({});
    
    const defaultSettings = await Settings.create({});

    logger.info('Settings reset to defaults');

    res.json({
      success: true,
      message: 'تم إعادة تعيين الإعدادات بنجاح',
      data: { settings: defaultSettings }
    });
  } catch (error) {
    logger.error('Reset Settings Error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في إعادة تعيين الإعدادات'
    });
  }
};