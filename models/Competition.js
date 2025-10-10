const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema({
  academy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Academy'
  },
  name: {
    type: String,
    required: true
  },
  sport: {
    type: String,
    enum: ['swimming', 'fitness', 'gym', 'other'],
    default: 'swimming'
  },
  date: Date,
  location: String,

  events: [{
    name: String,
    distance: String,
    style: String
  }],

  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    eventName: String,
    resultTime: String,
    position: Number,
    points: Number
  }],

  status: {
    type: String,
    enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
    default: 'upcoming'
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

CompetitionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

CompetitionSchema.index({ academy: 1, date: 1, status: 1 });

module.exports = mongoose.model('Competition', CompetitionSchema);

