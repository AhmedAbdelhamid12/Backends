const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  academy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Academy'
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'SAR'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  provider: {
    type: String,
    enum: ['stripe', 'local', 'other'],
    default: 'stripe'
  },
  providerPaymentId: String,
  description: String,
  metadata: mongoose.Schema.Types.Mixed,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

PaymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

PaymentSchema.index({ user: 1, createdAt: -1 });
PaymentSchema.index({ academy: 1, createdAt: -1 });
PaymentSchema.index({ subscription: 1 });
PaymentSchema.index({ status: 1 });

module.exports = mongoose.model('Payment', PaymentSchema);

