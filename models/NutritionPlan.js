const mongoose = require('mongoose');

const MealItemSchema = new mongoose.Schema({
  name: String,
  quantity: String,
  calories: Number,
  protein: Number,
  carbs: Number,
  fat: Number
}, { _id: false });

const DailyMealSchema = new mongoose.Schema({
  name: String,
  time: String,
  items: [MealItemSchema]
}, { _id: false });

const NutritionPlanSchema = new mongoose.Schema({
  academy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Academy'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  goal: {
    type: String,
    enum: ['weight_loss', 'performance', 'maintenance', 'muscle_gain', 'other'],
    default: 'performance'
  },
  description: String,
  durationWeeks: Number,
  dailyMeals: [DailyMealSchema],

  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

NutritionPlanSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

NutritionPlanSchema.index({ academy: 1, user: 1, status: 1 });

module.exports = mongoose.model('NutritionPlan', NutritionPlanSchema);

