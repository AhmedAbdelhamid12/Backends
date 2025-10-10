// middleware/validation.js
const Joi = require('joi');

// 🛡️ Middleware للتحقق من البيانات
const validateRequest = (schema) => {
  return (req, res, next) => {
    const options = {
      abortEarly: false,   // ✅ رجع كل الأخطاء مرة واحدة
      allowUnknown: false, // ❌ ما يقبلش حقول زيادة مش متعرفة
      stripUnknown: true   // ✅ شيل أي حقول زيادة من body
    };

    const { error, value } = schema.validate(req.body, options);

    if (error) {
      const errors = error.details.map(detail => {
        // تحسين رسائل الأخطاء
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

    req.body = value; // ✨ استخدم الـ body بعد التنضيف
    next();
  };
};

// 📝 مخططات التحقق
const authSchemas = {
  register: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'الاسم مطلوب',
        'string.min': 'الاسم يجب أن يكون على الأقل حرفين',
        'string.max': 'الاسم يجب ألا يزيد عن 50 حرف'
      }),
    
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'البريد الإلكتروني مطلوب',
        'string.email': 'البريد الإلكتروني غير صالح'
      }),
    
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.empty': 'كلمة المرور مطلوبة',
        'string.min': 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      }),
    
    role: Joi.string()
      .valid('admin', 'trainer', 'subscriber', 'parent')
      .required()
      .messages({
        'any.only': 'الدور يجب أن يكون: admin, trainer, subscriber, أو parent',
        'string.empty': 'الدور مطلوب'
      }),
    
    phone: Joi.string()
      .pattern(/^[\+]?[1-9][\d]{0,15}$/) // رقم هاتف دولي
      .optional()
      .messages({
        'string.pattern.base': 'رقم الهاتف غير صحيح. مثال: +201234567890 أو 01234567890'
      })
  }),

  login: Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.empty': 'البريد الإلكتروني مطلوب',
        'string.email': 'البريد الإلكتروني غير صالح'
      }),
    
    password: Joi.string()
      .required()
      .messages({
        'string.empty': 'كلمة المرور مطلوبة'
      })
  })
};

const userSchemas = {
  update: Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .optional()
      .messages({
        'string.min': 'الاسم يجب أن يكون على الأقل حرفين',
        'string.max': 'الاسم يجب ألا يزيد عن 50 حرف'
      }),
    
    phone: Joi.string()
      .pattern(/^[\+]?[1-9][\d]{0,15}$/)
      .optional()
      .messages({
        'string.pattern.base': 'رقم الهاتف غير صحيح'
      }),
    
    specialization: Joi.string()
      .optional()
      .messages({
        'string.empty': 'التخصص لا يمكن أن يكون فارغاً'
      }),
    
    experience: Joi.number()
      .min(0)
      .max(50)
      .optional()
      .messages({
        'number.min': 'الخبرة يجب أن تكون على الأقل 0 سنوات',
        'number.max': 'الخبرة لا يمكن أن تزيد عن 50 سنة'
      }),
    
    bio: Joi.string()
      .max(500)
      .optional()
      .messages({
        'string.max': 'السيرة الذاتية لا يمكن أن تزيد عن 500 حرف'
      }),
    
    birthDate: Joi.date()
      .max('now')
      .optional()
      .messages({
        'date.max': 'تاريخ الميلاد لا يمكن أن يكون في المستقبل'
      }),
    
    emergencyContact: Joi.object({
      name: Joi.string()
        .required()
        .messages({
          'string.empty': 'اسم جهة الاتصال مطلوب'
        }),
      phone: Joi.string()
        .required()
        .messages({
          'string.empty': 'رقم جهة الاتصال مطلوب'
        }),
      relation: Joi.string()
        .required()
        .messages({
          'string.empty': 'العلاقة مطلوبة'
        })
    }).optional()
  })
};

// مخططات إضافية للنظام
const subscriptionSchemas = {
  create: Joi.object({
    subscriberId: Joi.string().required().messages({
      'string.empty': 'معرف المشترك مطلوب'
    }),
    planType: Joi.string()
      .valid('basic', 'premium', 'vip', 'custom')
      .required()
      .messages({
        'any.only': 'نوع الخطة يجب أن يكون: basic, premium, vip, أو custom'
      }),
    planName: Joi.string().required().messages({
      'string.empty': 'اسم الخطة مطلوب'
    }),
    startDate: Joi.date().required().messages({
      'date.base': 'تاريخ البدء مطلوب'
    }),
    endDate: Joi.date().required().messages({
      'date.base': 'تاريخ الانتهاء مطلوب'
    }),
    price: Joi.number().min(0).required().messages({
      'number.min': 'السعر يجب أن يكون على الأقل 0',
      'number.base': 'السعر مطلوب'
    }),
    sessionsPerWeek: Joi.number().min(1).max(14).required().messages({
      'number.min': 'عدد الجلسات أسبوعياً يجب أن يكون على الأقل 1',
      'number.max': 'عدد الجلسات أسبوعياً لا يمكن أن يزيد عن 14'
    })
  })
};

module.exports = {
  validateRequest,
  authSchemas,
  userSchemas,
  subscriptionSchemas
};