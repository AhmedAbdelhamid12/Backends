const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Slug is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 5000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  published: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
courseSchema.index({ slug: 1 });
courseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CourseNew', courseSchema);