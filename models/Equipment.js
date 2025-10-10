const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
  // المعلومات الأساسية
  name: {
    type: String,
    required: [true, 'اسم المعدة مطلوب'],
    trim: true,
    maxlength: [100, 'الاسم لا يمكن أن يزيد عن 100 حرف']
  },
  category: {
    type: String,
    enum: ['swimming', 'fitness', 'safety', 'pool_maintenance', 'other'],
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: 1000
  },
  brand: String,
  model: String,
  serialNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  
  // الحالة والتوفر
  status: {
    type: String,
    enum: ['available', 'in_use', 'maintenance', 'damaged', 'retired'],
    default: 'available',
    index: true
  },
  condition: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor', 'needs_repair'],
    default: 'good'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  availableQuantity: {
    type: Number,
    min: 0,
    default: 1
  },
  
  // الموقع والتخزين
  location: {
    type: String,
    required: true,
    index: true
  },
  pool: String,
  storageLocation: String,
  
  // الشراء والصيانة
  purchaseDate: Date,
  purchasePrice: Number,
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  warrantyExpiry: Date,
  lastMaintenanceDate: Date,
  nextMaintenanceDate: Date,
  maintenanceHistory: [{
    date: Date,
    type: {
      type: String,
      enum: ['cleaning', 'repair', 'inspection', 'calibration', 'replacement']
    },
    description: String,
    cost: Number,
    performedBy: String,
    nextServiceDate: Date
  }],
  
  // الاستخدام
  usageHistory: [{
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingSession'
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    coachId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    date: Date,
    duration: Number,
    notes: String
  }],
  totalUsageHours: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // الصور والوثائق
  images: [{
    url: String,
    description: String,
    uploadedAt: Date
  }],
  documents: [{
    type: String,
    enum: ['manual', 'warranty', 'invoice', 'certificate', 'other'],
    url: String,
    uploadedAt: Date
  }],
  
  // الإعدادات والقواعد
  requiresMaintenance: {
    type: Boolean,
    default: false
  },
  requiresTraining: {
    type: Boolean,
    default: false
  },
  maxUsers: Number,
  minimumAge: Number,
  safetyNotes: String,
  
  // الإحصائيات
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: Date,
  
  // الملاحظات
  notes: {
    type: String,
    maxlength: 2000
  },
  
  // التواريخ
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  retiredAt: Date
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtuals
equipmentSchema.virtual('isAvailable').get(function() {
  return this.status === 'available' && this.availableQuantity > 0;
});

equipmentSchema.virtual('needsMaintenance').get(function() {
  if (!this.nextMaintenanceDate) return false;
  return this.nextMaintenanceDate <= new Date();
});

equipmentSchema.virtual('warrantyStatus').get(function() {
  if (!this.warrantyExpiry) return 'no_warranty';
  if (this.warrantyExpiry < new Date()) return 'expired';
  return 'active';
});

// Indexes
equipmentSchema.index({ category: 1, status: 1 });
equipmentSchema.index({ location: 1, status: 1 });
equipmentSchema.index({ status: 1, availableQuantity: 1 });
equipmentSchema.index({ nextMaintenanceDate: 1 });
equipmentSchema.index({ createdAt: -1 });

// Middleware
equipmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // تحديث الكمية المتاحة تلقائياً
  if (this.isModified('quantity') || this.isModified('status')) {
    if (this.status === 'available' || this.status === 'in_use') {
      this.availableQuantity = this.quantity;
    } else {
      this.availableQuantity = 0;
    }
  }
  
  next();
});

// Methods
equipmentSchema.methods.checkAvailability = function(quantity = 1) {
  return this.isAvailable && this.availableQuantity >= quantity;
};

equipmentSchema.methods.reserve = function(quantity = 1) {
  if (this.checkAvailability(quantity)) {
    this.availableQuantity -= quantity;
    return true;
  }
  return false;
};

equipmentSchema.methods.release = function(quantity = 1) {
  this.availableQuantity = Math.min(
    this.availableQuantity + quantity,
    this.quantity
  );
};

equipmentSchema.methods.recordUsage = function(sessionId, userId, coachId, duration, notes) {
  this.usageHistory.push({
    sessionId,
    userId,
    coachId,
    date: new Date(),
    duration,
    notes
  });
  this.usageCount += 1;
  this.totalUsageHours += (duration || 0) / 60; // تحويل الدقائق لساعات
  this.lastUsed = new Date();
};

equipmentSchema.methods.scheduleMaintenance = function(type, description, cost, performedBy, nextServiceDate) {
  this.maintenanceHistory.push({
    date: new Date(),
    type,
    description,
    cost,
    performedBy,
    nextServiceDate
  });
  this.lastMaintenanceDate = new Date();
  if (nextServiceDate) {
    this.nextMaintenanceDate = new Date(nextServiceDate);
  }
  this.requiresMaintenance = false;
};

// Static Methods
equipmentSchema.statics.getAvailableEquipment = function(category, location) {
  const query = {
    status: 'available',
    availableQuantity: { $gt: 0 }
  };
  
  if (category) query.category = category;
  if (location) query.location = location;
  
  return this.find(query).sort({ name: 1 });
};

equipmentSchema.statics.getMaintenanceSchedule = function(days = 30) {
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + days);
  
  return this.find({
    $or: [
      { nextMaintenanceDate: { $lte: targetDate, $gte: new Date() } },
      { requiresMaintenance: true }
    ]
  }).sort({ nextMaintenanceDate: 1 });
};

equipmentSchema.statics.getUsageStats = async function(period = 'month') {
  const startDate = new Date();
  if (period === 'week') {
    startDate.setDate(startDate.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(startDate.getMonth() - 1);
  } else {
    startDate.setFullYear(startDate.getFullYear() - 1);
  }
  
  return this.aggregate([
    {
      $match: {
        lastUsed: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$category',
        totalEquipment: { $sum: 1 },
        totalUsage: { $sum: '$usageCount' },
        totalHours: { $sum: '$totalUsageHours' },
        avgUsage: { $avg: '$usageCount' }
      }
    },
    {
      $sort: { totalUsage: -1 }
    }
  ]);
};

module.exports = mongoose.model('Equipment', equipmentSchema);

