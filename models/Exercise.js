const mongoose = require('mongoose');

const ExerciseSchema = new mongoose.Schema({
  academy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Academy'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['swim_technique', 'strength', 'cardio', 'flexibility', 'rehab', 'other'],
    default: 'other'
  },
  tags: [String],

  parameters: {
    distanceMeters: Number,
    durationSeconds: Number,
    reps: Number,
    sets: Number,
    intensity: { type: String, enum: ['low', 'medium', 'high'] }
  },

  media: {
    videoUrl: String,
    imageUrl: String
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

ExerciseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

ExerciseSchema.index({ academy: 1, category: 1 });
ExerciseSchema.index({ title: 'text', tags: 'text' });

module.exports = mongoose.model('Exercise', ExerciseSchema);

