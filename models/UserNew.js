const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Please enter a valid email'
    }
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'instructor', 'student'],
    default: 'student',
    required: true
  },
  theme: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light'
  },
  refreshTokenHash: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 });

module.exports = mongoose.model('UserNew', userSchema);