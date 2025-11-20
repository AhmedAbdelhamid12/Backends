const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  role: {
    type: String,
    required: true,
    trim: true,
    maxlength: [50, 'Role cannot exceed 50 characters']
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000
  },
  avatarUrl: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('TestimonialNew', testimonialSchema);