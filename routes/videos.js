const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع المسارات
router.get('/', videoController.getAllVideos);
router.get('/featured', videoController.getFeaturedVideos);
router.get('/:id', videoController.getVideoById);

// إنشاء وتحديث (للأدمن والمدرب)
router.post('/', authorize('admin', 'coach'), videoController.createVideo);
router.put('/:id', authorize('admin', 'coach'), videoController.updateVideo);
router.delete('/:id', authorize('admin', 'coach'), videoController.deleteVideo);

// تفاعلات
router.post('/:videoId/watch', videoController.updateWatchTime);
router.post('/:videoId/comment', videoController.addComment);

module.exports = router;

