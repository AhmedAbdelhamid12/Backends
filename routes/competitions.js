const express = require('express');
const router = express.Router();
const competitionController = require('../controllers/competitionController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع البطولات (أدمن ومدرب)
router.get('/', authorize('admin', 'coach'), competitionController.getCompetitions);

// بطولة واحدة (متاحة للجميع)
router.get('/:id', competitionController.getCompetitionById);

// إنشاء وتحديث وحذف (للأدمن والمدرب)
router.post('/', authorize('admin', 'coach'), competitionController.createCompetition);
router.put('/:id', authorize('admin', 'coach'), competitionController.updateCompetition);
router.delete('/:id', authorize('admin'), competitionController.deleteCompetition);

module.exports = router;

