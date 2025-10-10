// utils/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config/environment');
const logger = require('./logger');

// إنشاء ناقل البريد
const createTransporter = () => {
  if (!config.email.service || !config.email.user || !config.email.pass) {
    return null;
  }
  
  return nodemailer.createTransport({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
};

// قوالب البريد الإلكتروني
const emailTemplates = {
  'email-verification': ({ name, verificationUrl, supportEmail }) => ({
    subject: 'تحقق من بريدك الإلكتروني',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db; text-align: center;">تحقق من بريدك الإلكتروني</h2>
        <p>عزيزي/عزيزتي ${name},</p>
        <p>شكراً لانضمامك إلى أكاديمية السباحة. يرجى التحقق من بريدك الإلكتروني من خلال النقر على الرابط أدناه:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            تحقق من البريد الإلكتروني
          </a>
        </div>
        <p>إذا لم تطلب هذا التحقق، يمكنك تجاهل هذه الرسالة.</p>
        <p>مع أطيب التحيات,<br>فريق أكاديمية السباحة</p>
        <p style="font-size: 12px; color: #666;">للحصول على المساعدة، تواصل معنا على: ${supportEmail || 'support@swimacademy.com'}</p>
      </div>
    `
  }),

  'password-reset': ({ name, resetUrl, expiryTime }) => ({
    subject: 'إعادة تعيين كلمة المرور',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c; text-align: center;">إعادة تعيين كلمة المرور</h2>
        <p>عزيزي/عزيزتي ${name},</p>
        <p>لقد طلبت إعادة تعيين كلمة المرور. يمكنك النقر على الرابط أدناه لإعادة تعيين كلمة المرور:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            إعادة تعيين كلمة المرور
          </a>
        </div>
        <p>ينتهي هذا الرابط خلال ${expiryTime}.</p>
        <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة.</p>
        <p>مع أطيب التحيات,<br>فريق أكاديمية السباحة</p>
      </div>
    `
  }),

  welcome: ({ name }) => ({
    subject: 'مرحباً بك في أكاديمية السباحة واللياقة',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db; text-align: center;">مرحباً بك في أكاديمية السباحة واللياقة</h2>
        <p>عزيزي/عزيزتي ${name},</p>
        <p>نرحب بك في عائلة أكاديمية السباحة واللياقة. نحن سعداء بانضمامك إلينا.</p>
        <p>يمكنك الآن الوصول إلى جميع خدماتنا ومتابعة تقدمك من خلال تطبيقنا.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.clients.web}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            ابدأ رحلتك
          </a>
        </div>
        <p>مع أطيب التحيات,<br>فريق أكاديمية السباحة واللياقة</p>
      </div>
    `
  }),

  'subscription-renewal': ({ name, endDate }) => ({
    subject: 'تذكير بتجديد الاشتراك',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c; text-align: center;">تذكير بتجديد الاشتراك</h2>
        <p>عزيزي/عزيزتي ${name},</p>
        <p>نود تذكيرك بأن اشتراكك سينتهي في ${endDate}.</p>
        <p>يرجى تجديد اشتراكك للاستمرار في الاستفادة من خدماتنا.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.clients.web}/subscriptions" style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            تجديد الاشتراك
          </a>
        </div>
        <p>مع أطيب التحيات,<br>فريق أكاديمية السباحة واللياقة</p>
      </div>
    `
  }),

  'training-reminder': ({ name, sessionDate, trainerName }) => ({
    subject: 'تذكير بجلسة التدريب',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2ecc71; text-align: center;">تذكير بجلسة التدريب</h2>
        <p>عزيزي/عزيزتي ${name},</p>
        <p>نود تذكيرك بجلسة التدريب المقررة مع المدرب ${trainerName}.</p>
        <p><strong>موعد الجلسة:</strong> ${sessionDate}</p>
        <p>يرجى الحضور قبل الموعد بـ 10 دقائق.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.clients.web}/sessions" style="background-color: #2ecc71; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            عرض التفاصيل
          </a>
        </div>
        <p>مع أطيب التحيات,<br>فريق أكاديمية السباحة واللياقة</p>
      </div>
    `
  })
};

// إرسال البريد الإلكتروني - دالة متوافقة مع طريقة الاستدعاء في authController
exports.sendEmail = async (emailData) => {
  try {
    const { to, subject, template, context } = emailData;
    
    if (!config.email.service || !config.email.user || !config.email.pass) {
      logger.warn('Email service not configured. Email would be sent:', { to, subject, template });
      return true;
    }

    const transporter = createTransporter();
    if (!transporter) {
      logger.warn('Email transporter not available');
      return false;
    }

    let emailContent;
    
    // إذا كان هناك قالب، استخدمه
    if (template && emailTemplates[template]) {
      emailContent = emailTemplates[template](context || {});
    } else {
      // خلاف ذلك، استخدم البيانات المباشرة
      emailContent = {
        subject: subject || 'إشعار من أكاديمية السباحة',
        html: context?.html || context?.message || 'لا يوجد محتوى'
      };
    }
    
    const mailOptions = {
      from: config.email.from || config.email.user,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to: ${to}`);
    return true;
  } catch (error) {
    logger.error('Email sending error:', error);
    return false;
  }
};

// إرسال إشعارات متعددة
exports.sendBulkEmails = async (recipients, templateName, data) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await exports.sendEmail({
      to: recipient.email,
      template: templateName,
      context: { name: recipient.name, ...data }
    });
    results.push({
      email: recipient.email,
      success: result
    });
  }
  
  return results;
};