const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');
const Subscription = require('../models/Subscription');

describe('🏊 Training Sessions Tests', () => {
  let adminToken;
  let trainerToken;
  let subscriberToken;
  let trainerId;
  let subscriberId;
  let subscriptionId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany();
    await TrainingSession.deleteMany();
    await Subscription.deleteMany();

    // إنشاء مستخدمين للاختبار
    const admin = await User.create({
      name: 'مدير النظام',
      email: 'admin@test.com',
      password: 'Test123456',
      role: 'admin'
    });

    const trainer = await User.create({
      name: 'مدرب Test',
      email: 'trainer@test.com',
      password: 'Test123456',
      role: 'coach',
      specialization: 'سباحة'
    });
    trainerId = trainer._id;

    const subscriber = await User.create({
      name: 'مشترك Test',
      email: 'subscriber@test.com',
      password: 'Test123456',
      role: 'user'
    });
    subscriberId = subscriber._id;

    // إنشاء اشتراك
    const subscription = await Subscription.create({
      userId: subscriberId,
      coachId: trainerId,
      planType: 'premium',
      planName: 'Test Plan',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      price: 1200,
      sessionsPerWeek: 3,
      totalSessions: 12,
      createdBy: admin._id
    });
    subscriptionId = subscription._id;

    // تحديث المدرب بإضافة المتدرب
    await User.findByIdAndUpdate(trainerId, {
      $push: { trainees: { trainee: subscriberId } }
    });

    // الحصول على التوكنات
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Test123456' });
    adminToken = adminLogin.body.data.accessToken;

    const trainerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'trainer@test.com', password: 'Test123456' });
    trainerToken = trainerLogin.body.data.accessToken;

    const subscriberLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'subscriber@test.com', password: 'Test123456' });
    subscriberToken = subscriberLogin.body.data.accessToken;
  });

  describe('POST /api/training-sessions', () => {
    it('should create training session as trainer', async () => {
      const sessionData = {
        coachId: trainerId.toString(),
        userId: subscriberId.toString(),
        subscriptionId: subscriptionId.toString(),
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // غداً
        duration: 60,
        type: 'swimming',
        location: 'المسبح الرئيسي'
      };

      const response = await request(app)
        .post('/api/training-sessions')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.session.type).toBe(sessionData.type);
      expect(response.body.data.session.status).toBe('scheduled');
    });

    it('should not allow subscriber to create session', async () => {
      const sessionData = {
        coachId: trainerId.toString(),
        userId: subscriberId.toString(),
        date: new Date(),
        duration: 60,
        type: 'swimming',
        location: 'المسبح'
      };

      const response = await request(app)
        .post('/api/training-sessions')
        .set('Authorization', `Bearer ${subscriberToken}`)
        .send(sessionData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/training-sessions', () => {
    beforeEach(async () => {
      // إنشاء جلسة تدريبية للاختبار
      const sessionDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const endTime = new Date(sessionDate.getTime() + 60 * 60000); // مدة الجلسة 60 دقيقة

      await TrainingSession.create({
        coachId: trainerId,
        userId: subscriberId,
        subscriptionId,
        date: sessionDate,
        endTime,
        duration: 60,
        type: 'swimming',
        location: 'المسبح',
        createdBy: trainerId
      });
    });

    it('should get training sessions for trainer', async () => {
      const response = await request(app)
        .get('/api/training-sessions')
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeInstanceOf(Array);
    });

    it('should get training sessions for subscriber', async () => {
      const response = await request(app)
        .get('/api/training-sessions')
        .set('Authorization', `Bearer ${subscriberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeInstanceOf(Array);
    });
  });
});