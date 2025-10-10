// middleware/validation.js
const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const options = {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true
    };

    const { error, value } = schema.validate(req.body, options);

    if (error) {
      const errors = error.details.map(detail => {
        switch (detail.type) {
          case 'any.required':
            return `حقل ${detail.path.join('.')} مطلوب`;
          case 'string.empty':
            return `حقل ${detail.path.join('.')} لا يمكن أن يكون فارغاً`;
          case 'string.email':
            return `صيغة البريد الإلكتروني غير صحيحة`;
          case 'string.min':
            return `${detail.path.join('.')} يجب أن يكون على الأقل ${detail.context.limit} أحرف`;
          case 'any.only':
            return `${detail.path.join('.')} يجب أن يكون واحد من: ${detail.context.valids.join(', ')}`;
          default:
            return detail.message;
        }
      });

      return res.status(400).json({
        success: false,
        message: 'بيانات غير صحيحة',
        errors
      });
    }

    req.body = value;
    next();
  };
};

const validateParams = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'معرف غير صالح',
        errors: error.details.map(detail => detail.message)
      });
    }

    req.params = value;
    next();
  };
};

const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'بيانات البحث غير صحيحة',
        errors: error.details.map(detail => detail.message)
      });
    }

    req.query = value;
    next();
  };
};

const authSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'coach', 'user').required(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    birthDate: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female').optional(),
    specialization: Joi.string().max(100).optional()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required()
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })
};

const userSchemas = {
  update: Joi.object({
    name: Joi.string().min(2).max(50).optional(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    specialization: Joi.string().max(100).optional(),
    experience: Joi.number().min(0).max(50).optional(),
    bio: Joi.string().max(500).optional(),
    birthDate: Joi.date().max('now').optional(),
    gender: Joi.string().valid('male', 'female').optional(),
    emergencyContact: Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().required(),
      relation: Joi.string().required()
    }).optional(),
    medicalNotes: Joi.string().max(1000).optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('active', 'inactive', 'suspended').required(),
    reason: Joi.string().max(500).optional()
  }),

  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
};

const subscriptionSchemas = {
  create: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    planType: Joi.string().valid('basic', 'premium', 'vip', 'custom').required(),
    planName: Joi.string().required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    price: Joi.number().min(0).required(),
    sessionsPerWeek: Joi.number().min(1).max(14).required(),
    totalSessions: Joi.number().min(1).required(),
    coachId: Joi.string().hex().length(24).optional(),
    paymentMethod: Joi.string().valid('cash', 'card', 'transfer').optional(),
    autoRenew: Joi.boolean().optional()
  }),

  update: Joi.object({
    planType: Joi.string().valid('basic', 'premium', 'vip', 'custom').optional(),
    planName: Joi.string().optional(),
    endDate: Joi.date().optional(),
    price: Joi.number().min(0).optional(),
    sessionsPerWeek: Joi.number().min(1).max(14).optional(),
    totalSessions: Joi.number().min(1).optional(),
    status: Joi.string().valid('active', 'expired', 'cancelled', 'paused').optional(),
    paymentStatus: Joi.string().valid('pending', 'paid', 'failed', 'refunded').optional()
  }),

  renew: Joi.object({
    newEndDate: Joi.date().required(),
    price: Joi.number().min(0).optional(),
    planType: Joi.string().valid('basic', 'premium', 'vip', 'custom').optional(),
    planName: Joi.string().optional(),
    carryOverSessions: Joi.boolean().optional()
  }),

  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
};

const sessionSchemas = {
  create: Joi.object({
    coachId: Joi.string().hex().length(24).required(),
    userId: Joi.string().hex().length(24).required(),
    subscriptionId: Joi.string().hex().length(24).optional(),
    date: Joi.date().required(),
    duration: Joi.number().min(15).max(240).required(),
    type: Joi.string().valid('swimming', 'fitness', 'rehabilitation', 'technical').required(),
    location: Joi.string().max(100).optional(),
    pool: Joi.string().max(50).optional(),
    notes: Joi.string().max(1000).optional(),
    exercises: Joi.array().items(Joi.string()).optional(),
    objectives: Joi.array().items(Joi.string()).optional()
  }),

  update: Joi.object({
    date: Joi.date().optional(),
    duration: Joi.number().min(15).max(240).optional(),
    type: Joi.string().valid('swimming', 'fitness', 'rehabilitation', 'technical').optional(),
    location: Joi.string().max(100).optional(),
    pool: Joi.string().max(50).optional(),
    notes: Joi.string().max(1000).optional(),
    exercises: Joi.array().items(Joi.string()).optional(),
    objectives: Joi.array().items(Joi.string()).optional(),
    status: Joi.string().valid('scheduled', 'in-progress', 'completed', 'cancelled').optional()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('scheduled', 'in-progress', 'completed', 'cancelled').required(),
    notes: Joi.string().max(1000).optional(),
    actualStart: Joi.date().optional(),
    actualEnd: Joi.date().optional()
  }),

  recordProgress: Joi.object({
    metrics: Joi.object().optional(),
    skillsProgress: Joi.array().items(Joi.object({
      skill: Joi.string().required(),
      proficiency: Joi.number().min(1).max(10).required(),
      notes: Joi.string().optional()
    })).optional(),
    coachNotes: Joi.string().max(1000).optional(),
    achievements: Joi.array().items(Joi.string()).optional()
  }),

  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
};

const progressSchemas = {
  create: Joi.object({
    userId: Joi.string().hex().length(24).required(),
    sessionId: Joi.string().hex().length(24).optional(),
    date: Joi.date().required(),
    type: Joi.string().valid('training', 'measurement', 'assessment', 'milestone').required(),
    metrics: Joi.object().optional(),
    notes: Joi.string().max(1000).optional(),
    selfRating: Joi.number().min(1).max(10).optional(),
    coachFeedback: Joi.string().max(1000).optional(),
    objectives: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    duration: Joi.number().min(1).optional(),
    intensity: Joi.number().min(1).max(10).optional()
  }),

  update: Joi.object({
    date: Joi.date().optional(),
    type: Joi.string().valid('training', 'measurement', 'assessment', 'milestone').optional(),
    metrics: Joi.object().optional(),
    notes: Joi.string().max(1000).optional(),
    selfRating: Joi.number().min(1).max(10).optional(),
    coachFeedback: Joi.string().max(1000).optional(),
    objectives: Joi.array().items(Joi.string()).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    duration: Joi.number().min(1).optional(),
    intensity: Joi.number().min(1).max(10).optional()
  }),

  addSkill: Joi.object({
    skill: Joi.string().required(),
    proficiency: Joi.number().min(1).max(10).required(),
    notes: Joi.string().optional(),
    coachNotes: Joi.string().optional(),
    category: Joi.string().optional()
  }),

  idParam: Joi.object({
    id: Joi.string().hex().length(24).required()
  })
};

const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  dateRange: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
  }),

  search: Joi.object({
    search: Joi.string().max(100).optional()
  })
};

module.exports = {
  validateRequest,
  validateParams,
  validateQuery,
  authSchemas,
  userSchemas,
  subscriptionSchemas,
  sessionSchemas,
  progressSchemas,
  querySchemas
};