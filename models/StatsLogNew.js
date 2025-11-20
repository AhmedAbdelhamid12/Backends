const mongoose = require('mongoose');

const statsLogSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['revenue', 'users', 'enrollments', 'growth']
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes
statsLogSchema.index({ type: 1 });
statsLogSchema.index({ date: -1 });

module.exports = mongoose.model('StatsLogNew', statsLogSchema);