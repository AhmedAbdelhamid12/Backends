const express = require('express');
const router = express.Router();
const exerciseController = require('../controllers/exerciseController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// التمارين متاحة لجميع المستخدمين المسجلين
router.get('/', exerciseController.getExercises);
router.get('/:id', exerciseController.getExerciseById);

// إنشاء وتحديث وحذف (للأدمن والمدرب)
router.post('/', authorize('admin', 'coach'), exerciseController.createExercise);
router.put('/:id', authorize('admin', 'coach'), exerciseController.updateExercise);
router.delete('/:id', authorize('admin', 'coach'), exerciseController.deleteExercise);

module.exports = router;

