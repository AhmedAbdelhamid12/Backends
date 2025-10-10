const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع المسارات
router.get('/', achievementController.getAllAchievements);
router.get('/my-achievements', achievementController.getUserAchievements);
router.get('/recent', achievementController.getRecentAchievements);
router.get('/user/:userId', achievementController.getUserAchievements);

// إنشاء وتحديث (للأدمن فقط)
router.post('/', authorize('admin'), achievementController.createAchievement);
router.put('/:id', authorize('admin'), achievementController.updateAchievement);

// منح إنجاز (للأدمن والمدرب)
router.post('/grant', authorize('admin', 'coach'), achievementController.grantAchievement);

module.exports = router;

