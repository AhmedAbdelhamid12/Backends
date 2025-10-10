const mongoose = require('mongoose');
const crypto = require('crypto');

// Prevent duplicate model compilation
if (mongoose.models.Token) {
  module.exports = mongoose.models.Token;
} else {
  const tokenSchema = new mongoose.Schema({
    // المعلومات الأساسية
    token: {
      type: String,
      required: [true, 'التوكن مطلوب'],
      unique: true
      // Note: unique: true automatically creates an index
    },
    type: {
      type: String,
      enum: ['access', 'refresh', 'verification', 'reset', 'api'],
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'المستخدم مطلوب'],
      index: true
    },

    // الصلاحية والاستخدام
    expiresAt: {
      type: Date,
      required: true
    },
    used: {
      type: Boolean,
      default: false
    },
    usedAt: Date,
    useCount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxUses: {
      type: Number,
      default: 1
    },

    // البيانات الإضافية
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    deviceInfo: {
      userAgent: String,
      ip: String,
      location: {
        country: String,
        city: String,
        timezone: String
      }
    },
    scopes: [{
      type: String,
      trim: true
    }],

    // الأمان
    isRevoked: {
      type: Boolean,
      default: false
    },
    revokedAt: Date,
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    revokedReason: String,

    // التتبع
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    lastUsedAt: Date
  }, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });

  // Virtuals
  tokenSchema.virtual('isExpired').get(function() {
    return this.expiresAt < new Date();
  });

  tokenSchema.virtual('isValid').get(function() {
    return !this.isExpired && !this.isRevoked && !this.used && this.useCount < this.maxUses;
  });

  tokenSchema.virtual('daysUntilExpiry').get(function() {
    const diffTime = Math.abs(this.expiresAt - new Date());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  });

  // Indexes
  // Note: token field already has unique index from unique: true
  tokenSchema.index({ userId: 1, type: 1 });
  tokenSchema.index({ token: 1, type: 1 }); // Compound index for token+type queries
  tokenSchema.index({ createdAt: -1 });
  // TTL index for automatic cleanup - using expireAfterSeconds to auto-delete expired tokens
  // Note: expireAfterSeconds: 0 means documents are deleted immediately when expiresAt date is reached
  tokenSchema.index({ expiresAt: 1 }, { 
    expireAfterSeconds: 0
  });
  tokenSchema.index({ isRevoked: 1 });

  // Middleware
  tokenSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
  });

  // Static Methods
  tokenSchema.statics.generateToken = function(type, userId, options = {}) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    
    // تعيين مدة الصلاحية حسب نوع التوكن
    const expiryDurations = {
      access: 60 * 60 * 1000, // 1 hour
      refresh: 7 * 24 * 60 * 60 * 1000, // 7 days
      verification: 24 * 60 * 60 * 1000, // 24 hours
      reset: 10 * 60 * 1000, // 10 minutes
      api: 365 * 24 * 60 * 60 * 1000 // 1 year
    };
    
    expiresAt.setTime(expiresAt.getTime() + (options.expiresIn || expiryDurations[type] || 3600000));
    
    return new this({
      token,
      type,
      userId,
      expiresAt,
      payload: options.payload || {},
      deviceInfo: options.deviceInfo || {},
      scopes: options.scopes || [],
      maxUses: options.maxUses || 1
    });
  };

  tokenSchema.statics.verifyToken = async function(token, type, options = {}) {
    const tokenDoc = await this.findOne({
      token,
      type,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).populate('userId');
    
    if (!tokenDoc) {
      throw new Error('التوكن غير صالح أو منتهي الصلاحية');
    }
    
    if (tokenDoc.used && tokenDoc.maxUses === 1) {
      throw new Error('التوكن مستخدم مسبقاً');
    }
    
    if (tokenDoc.useCount >= tokenDoc.maxUses) {
      throw new Error('تم تجاوز عدد استخدامات التوكن المسموح بها');
    }
    
    // تحديث عدد الاستخدامات
    tokenDoc.useCount += 1;
    tokenDoc.lastUsedAt = new Date();
    
    if (tokenDoc.useCount >= tokenDoc.maxUses) {
      tokenDoc.used = true;
      tokenDoc.usedAt = new Date();
    }
    
    await tokenDoc.save();
    
    return tokenDoc;
  };

  tokenSchema.statics.revokeUserTokens = async function(userId, reason = 'system') {
    const result = await this.updateMany(
      {
        userId,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      },
      {
        $set: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: reason
        }
      }
    );
    
    return result.modifiedCount;
  };

  tokenSchema.statics.cleanupExpiredTokens = async function() {
    const result = await this.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isRevoked: true }
      ]
    });
    
    return result.deletedCount;
  };

  // Methods
  tokenSchema.methods.revoke = function(reason = 'user', revokedBy = null) {
    this.isRevoked = true;
    this.revokedAt = new Date();
    this.revokedReason = reason;
    this.revokedBy = revokedBy;
  };

  tokenSchema.methods.extendExpiry = function(additionalTime) {
    this.expiresAt = new Date(this.expiresAt.getTime() + additionalTime);
  };

  // Compile and export model
  const Token = mongoose.model('Token', tokenSchema);
  module.exports = Token;
}
