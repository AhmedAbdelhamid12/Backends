const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  icon: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceNew', serviceSchema);