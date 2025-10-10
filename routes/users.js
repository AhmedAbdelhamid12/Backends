// routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

// جميع المسارات تتطلب مصادقة
router.use(auth);

// الأدمن فقط يمكنه الوصول لجميع المستخدمين
router.get('/', authorize('admin'), userController.getAllUsers);
router.get('/stats', authorize('admin'), userController.getUsersStats);
router.put('/:id/status', authorize('admin'), userController.updateUserStatus);
router.delete('/:id', authorize('admin'), userController.deleteUser);

// المدربون يمكنهم رؤية المدربين الآخرين
router.get('/trainers', authorize('admin', 'trainer', 'subscriber', 'parent'), userController.getTrainers);

// إضافة متدرب للمدرب (للأدمن والمدرب)
router.post('/trainers/trainees', authorize('admin', 'trainer'), userController.addTraineeToTrainer);

// أي مستخدم مصادق يمكنه الوصول لبياناته
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

module.exports = router;