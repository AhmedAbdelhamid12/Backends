const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع الفرق (أدمن ومدرب)
router.get('/', authorize('admin', 'coach'), teamController.getTeams);
router.get('/my-teams', authorize('admin', 'coach'), teamController.getTeams);

// فريق واحد
router.get('/:id', teamController.getTeamById);

// إنشاء وتحديث وحذف (للأدمن والمدرب)
router.post('/', authorize('admin', 'coach'), teamController.createTeam);
router.put('/:id', authorize('admin', 'coach'), teamController.updateTeam);
router.delete('/:id', authorize('admin'), teamController.deleteTeam);

module.exports = router;

