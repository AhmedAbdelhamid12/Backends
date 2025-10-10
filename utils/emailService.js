// utils/emailService.js
const nodemailer = require('nodemailer');
const config = require('../config/environment');

// إنشاء ناقل البريد
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: config.email.service,
    auth: {
      user: config.email.user,
      pass: config.email.pass
    }
  });
};

// قوالب البريد الإلكتروني
const emailTemplates = {
  welcome: (name) => ({
    subject: 'مرحباً بك في أكاديمية السباحة واللياقة',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3498db; text-align: center;">مرحباً بك في أكاديمية السباحة واللياقة</h2>
        <p>عزيزي/عزيزتي ${name},</p>
        <p>نرحب بك في عائلة أكاديمية السباحة واللياقة. نحن سعداء بانضمامك إلينا.</p>
        <p>يمكنك الآن الوصول إلى جميع خدماتنا ومتابعة تقدمك من خلال تطبيقنا.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.clientUrl}" style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            ابدأ رحلتك
          </a>
        </div>
        <p>مع أطيب التحيات,<br>فريق أكاديمية السباحة واللياقة</p>
      </div>
    `
  }),

  subscriptionRenewal: (name, endDate) => ({
    subject: 'تذكير بتجديد الاشتراك',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c; text-align: center;">تذكير بتجديد الاشتراك</h2>
        <p>عزيزي/عزيزتي ${name},</p>
        <p>نود تذكيرك بأن اشتراكك سينتهي في ${endDate}.</p>
        <p>يرجى تجديد اشتراكك للاستمرار في الاستفادة من خدماتنا.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.clientUrl}/subscriptions" style="background-color: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            تجديد الاشتراك
          </a>
        </div>
        <p>مع أطيب التحيات,<br>فريق أكاديمية السباحة واللياقة</p>
      </div>
    `
  }),

  trainingReminder: (name, sessionDate, trainerName) => ({
    subject: 'تذكير بجلسة التدريب',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2ecc71; text-align: center;">تذكير بجلسة التدريب</h2>
        <p>عزيزي/عزيزتي ${name},</p>
        <p>نود تذكيرك بجلسة التدريب المقررة مع المدرب ${trainerName}.</p>
        <p><strong>موعد الجلسة:</strong> ${sessionDate}</p>
        <p>يرجى الحضور قبل الموعد بـ 10 دقائق.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${config.clientUrl}/sessions" style="background-color: #2ecc71; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px;">
            عرض التفاصيل
          </a>
        </div>
        <p>مع أطيب التحيات,<br>فريق أكاديمية السباحة واللياقة</p>
      </div>
    `
  })
};

// إرسال البريد الإلكتروني
exports.sendEmail = async (to, templateName, data) => {
  try {
    if (!config.email.service) {
      console.log('خدمة البريد الإلكتروني غير مهيئة. سيتم تسجيل البريد فقط:', {
        to,
        templateName,
        data
      });
      return true;
    }

    const transporter = createTransporter();
    const template = emailTemplates[templateName](...data);
    
    const mailOptions = {
      from: config.email.user,
      to,
      subject: template.subject,
      html: template.html
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ تم إرسال البريد الإلكتروني إلى: ${to}`);
    return true;
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد الإلكتروني:', error);
    return false;
  }
};

// إرسال إشعارات متعددة
exports.sendBulkEmails = async (recipients, templateName, data) => {
  const results = [];
  
  for (const recipient of recipients) {
    const result = await this.sendEmail(recipient.email, templateName, [recipient.name, ...data]);
    results.push({
      email: recipient.email,
      success: result
    });
  }
  
  return results;
};