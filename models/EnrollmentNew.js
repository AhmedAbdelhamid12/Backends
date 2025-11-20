const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserNew',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CourseNew',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Indexes
enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ courseId: 1 });
enrollmentSchema.index({ status: 1 });
enrollmentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EnrollmentNew', enrollmentSchema);