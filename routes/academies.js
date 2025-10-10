const express = require('express');
const router = express.Router();
const academyController = require('../controllers/academyController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع الأكاديميات (للأدمن)
router.get('/', authorize('admin'), academyController.getAcademies);

// أكاديمية واحدة
router.get('/:id', academyController.getAcademyById);

// إنشاء وتحديث وحذف (للأدمن فقط)
router.post('/', authorize('admin'), academyController.createAcademy);
router.put('/:id', authorize('admin'), academyController.updateAcademy);
router.delete('/:id', authorize('admin'), academyController.deleteAcademy);

module.exports = router;

