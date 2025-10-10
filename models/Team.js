const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  academy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Academy',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  sport: {
    type: String,
    enum: ['swimming', 'fitness', 'gym'],
    required: true
  },
  ageGroup: String,
  level: String,

  coach: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assistantCoaches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  members: [{
    trainee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    joinedAt: { type: Date, default: Date.now }
  }],

  notes: String,
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
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

TeamSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

TeamSchema.index({ academy: 1 });
TeamSchema.index({ coach: 1 });
TeamSchema.index({ status: 1 });

module.exports = mongoose.model('Team', TeamSchema);

