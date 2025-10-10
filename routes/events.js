const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع المسارات
router.get('/', eventController.getAllEvents);
router.get('/upcoming', eventController.getUpcomingEvents);
router.get('/ongoing', eventController.getOngoingEvents);
router.get('/stats', authorize('admin'), eventController.getEventStats);
router.get('/:id', eventController.getEventById);

// إنشاء وتحديث (للأدمن والمدرب)
router.post('/', authorize('admin', 'coach'), eventController.createEvent);
router.put('/:id', authorize('admin', 'coach'), eventController.updateEvent);
router.delete('/:id', authorize('admin'), eventController.deleteEvent);

// التسجيل في الأحداث
router.post('/:eventId/register', eventController.registerParticipant);
router.post('/:eventId/cancel', eventController.cancelRegistration);

// تسجيل النتائج (للأدمن والمدرب)
router.post('/:eventId/competitions/:competitionIndex/results', 
  authorize('admin', 'coach'), 
  eventController.recordCompetitionResult
);

module.exports = router;

