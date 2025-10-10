const express = require('express');
const router = express.Router();
const nutritionPlanController = require('../controllers/nutritionPlanController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth);

// جميع خطط التغذية (للأدمن والمدرب)
router.get('/', authorize('admin', 'coach'), nutritionPlanController.getNutritionPlans);

// خطط المستخدم الحالي
router.get('/me', nutritionPlanController.getMyNutritionPlans);

// خطة واحدة
router.get('/:id', nutritionPlanController.getNutritionPlanById);

// إنشاء وتحديث وحذف (للأدمن والمدرب)
router.post('/', authorize('admin', 'coach'), nutritionPlanController.createNutritionPlan);
router.put('/:id', authorize('admin', 'coach'), nutritionPlanController.updateNutritionPlan);
router.delete('/:id', authorize('admin', 'coach'), nutritionPlanController.deleteNutritionPlan);

module.exports = router;

