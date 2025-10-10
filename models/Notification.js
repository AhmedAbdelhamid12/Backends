const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // المستلم
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'المستلم مطلوب'],
    index: true
  },

  // المحتوى
  title: {
    type: String,
    required: [true, 'عنوان الإشعار مطلوب'],
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: [true, 'محتوى الإشعار مطلوب'],
    trim: true,
    maxlength: 1000
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // النوع والتصنيف
  type: {
    type: String,
    enum: [
      'session_reminder',
      'progress_update', 
      'payment',
      'system',
      'security',
      'marketing',
      'achievement',
      'warning',
      'info'
    ],
    required: true,
    index: true
  },
  category: {
    type: String,
    enum: ['training', 'billing', 'security', 'system', 'marketing', 'social'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    index: true
  },

  // التوجيه والإجراءات
  actionUrl: String,
  actionLabel: String,
  deepLink: String,
  actions: [{
    label: String,
    action: String,
    url: String,
    method: String,
    payload: mongoose.Schema.Types.Mixed
  }],

  // التوصيل والحالة
  channels: [{
    type: String,
    enum: ['email', 'push', 'sms', 'in_app'],
    required: true
  }],
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'clicked', 'failed', 'pending'],
    default: 'pending',
    index: true
  },
  delivery: {
    email: {
      sent: Boolean,
      delivered: Boolean,
      opened: Boolean,
      clicked: Boolean,
      error: String
    },
    push: {
      sent: Boolean,
      delivered: Boolean,
      opened: Boolean,
      error: String
    },
    sms: {
      sent: Boolean,
      delivered: Boolean,
      error: String
    }
  },

  // التوقيت
  scheduledFor: {
    type: Date,
    index: true
  },
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  clickedAt: Date,
  expiresAt: {
    type: Date
  },

  // المرسل
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  systemSource: {
    type: String,
    enum: ['auto', 'manual', 'api', 'system']
  },

  // التخصيص
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tags: [String],

  // التواريخ
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

// Virtuals
notificationSchema.virtual('isRead').get(function() {
  return !!this.readAt;
});

notificationSchema.virtual('isActionable').get(function() {
  return !!this.actionUrl || (this.actions && this.actions.length > 0);
});

notificationSchema.virtual('isExpired').get(function() {
  return this.expiresAt && this.expiresAt < new Date();
});

notificationSchema.virtual('timeSinceCreated').get(function() {
  return Date.now() - this.createdAt;
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1, status: 1 });
notificationSchema.index({ priority: 1, scheduledFor: 1 });
notificationSchema.index({ 'delivery.email.sent': 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Middleware
notificationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // تعيين تاريخ انتهاء افتراضي إذا لم يتم تحديده
  if (!this.expiresAt) {
    this.expiresAt = new Date(this.createdAt.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 يوم
  }
  
  next();
});

// Static Methods
notificationSchema.statics.createNotification = function(recipient, data) {
  return new this({
    recipient,
    title: data.title,
    message: data.message,
    type: data.type || 'info',
    category: data.category || 'system',
    priority: data.priority || 'medium',
    actionUrl: data.actionUrl,
    actionLabel: data.actionLabel,
    channels: data.channels || ['in_app'],
    data: data.data || {},
    sender: data.sender,
    systemSource: data.systemSource || 'auto',
    scheduledFor: data.scheduledFor,
    metadata: data.metadata || {},
    tags: data.tags || []
  });
};

notificationSchema.statics.getUserNotifications = function(userId, options = {}) {
  const query = { recipient: userId };
  const { read, type, limit = 20, skip = 0 } = options;
  
  if (read !== undefined) {
    query.readAt = read ? { $ne: null } : null;
  }
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('sender', 'name profileImage')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    {
      recipient: userId,
      readAt: null
    },
    {
      $set: {
        readAt: new Date(),
        status: 'read'
      }
    }
  );
};

notificationSchema.statics.cleanupOldNotifications = async function(days = 90) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const result = await this.deleteMany({
    createdAt: { $lt: cutoffDate },
    status: { $in: ['read', 'delivered'] },
    priority: { $ne: 'urgent' }
  });
  
  return result.deletedCount;
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({
    recipient: userId,
    readAt: null,
    expiresAt: { $gt: new Date() }
  });
};

// Methods
notificationSchema.methods.markAsRead = function() {
  this.readAt = new Date();
  this.status = 'read';
};

notificationSchema.methods.markAsDelivered = function(channel) {
  if (channel === 'email') {
    this.delivery.email.delivered = true;
    this.delivery.email.deliveredAt = new Date();
  } else if (channel === 'push') {
    this.delivery.push.delivered = true;
    this.delivery.push.deliveredAt = new Date();
  } else if (channel === 'sms') {
    this.delivery.sms.delivered = true;
    this.delivery.sms.deliveredAt = new Date();
  }
  
  if (!this.deliveredAt) {
    this.deliveredAt = new Date();
    this.status = 'delivered';
  }
};

notificationSchema.methods.recordClick = function() {
  this.clickedAt = new Date();
  this.status = 'clicked';
};

notificationSchema.methods.reschedule = function(newDate) {
  this.scheduledFor = newDate;
  this.status = 'pending';
};

module.exports = mongoose.model('Notification', notificationSchema);