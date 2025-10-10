const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/equipmentController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع المسارات
router.get('/', equipmentController.getAllEquipment);
router.get('/available', equipmentController.getAvailableEquipment);
router.get('/maintenance', equipmentController.getMaintenanceSchedule);
router.get('/stats', authorize('admin'), equipmentController.getEquipmentStats);
router.get('/:id', equipmentController.getEquipmentById);

// إنشاء وتحديث (للأدمن والمدرب)
router.post('/', authorize('admin', 'coach'), equipmentController.createEquipment);
router.put('/:id', authorize('admin', 'coach'), equipmentController.updateEquipment);
router.delete('/:id', authorize('admin'), equipmentController.deleteEquipment);

// حجز وإطلاق المعدات
router.post('/reserve', authorize('admin', 'coach'), equipmentController.reserveEquipment);
router.post('/release', authorize('admin', 'coach'), equipmentController.releaseEquipment);

// استخدام وصيانة
router.post('/usage', authorize('admin', 'coach'), equipmentController.recordUsage);
router.post('/maintenance', authorize('admin'), equipmentController.scheduleMaintenance);

module.exports = router;

