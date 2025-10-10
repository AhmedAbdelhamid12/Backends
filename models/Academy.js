const mongoose = require('mongoose');

const AcademySchema = new mongoose.Schema({
  // Basic info
  name: {
    type: String,
    required: [true, 'اسم الأكاديمية مطلوب'],
    trim: true,
    maxlength: [150, 'الاسم لا يمكن أن يزيد عن 150 حرف']
  },
  description: {
    type: String,
    maxlength: 2000
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'مالك الأكاديمية مطلوب']
  },
  logo: {
    url: String,
    thumbnail: String
  },
  coverImage: {
    url: String,
    thumbnail: String
  },

  // Domain
  sports: [{
    type: String,
    enum: ['swimming', 'fitness', 'gym']
  }],
  branches: [{
    name: String,
    city: String,
    address: String,
    timezone: String,
    phone: String,
    email: String
  }],

  settings: {
    currency: { type: String, default: 'SAR' },
    timezone: { type: String, default: 'Asia/Riyadh' },
    locale: { type: String, default: 'ar-SA' },
    defaultLanguage: { type: String, default: 'ar' }
  },

  billing: {
    stripeCustomerId: String,
    billingEmail: String,
    nextBillingDate: Date,
    planName: String
  },

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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

AcademySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

AcademySchema.index({ owner: 1 });
AcademySchema.index({ status: 1 });

module.exports = mongoose.model('Academy', AcademySchema);

