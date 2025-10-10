const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

describe('💳 Subscriptions Tests', () => {
  let adminToken;
  let trainerToken;
  let subscriberToken;
  let trainerId;
  let subscriberId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swimacademy_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany();
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
      role: 'coach'
    });

    const subscriber = await User.create({
      name: 'مشترك Test',
      email: 'subscriber@test.com',
      password: 'Test123456',
      role: 'user'
    });

    trainerId = trainer._id;
    subscriberId = subscriber._id;

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

  describe('POST /api/subscriptions', () => {
    it('should create subscription as admin', async () => {
      const subscriptionData = {
        userId: subscriberId.toString(),
        coachId: trainerId.toString(),
        planType: 'premium',
        planName: 'بريميوم - 3 جلسات أسبوعياً',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        price: 1200,
        sessionsPerWeek: 3,
        totalSessions: 12
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(subscriptionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.subscription.planType).toBe(subscriptionData.planType);
      expect(response.body.data.subscription.status).toBe('active');
    });

    it('should not allow subscriber to create subscription', async () => {
      const subscriptionData = {
        userId: subscriberId.toString(),
        planType: 'basic',
        planName: 'بيسك',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        price: 800,
        sessionsPerWeek: 2,
        totalSessions: 8
      };

      const response = await request(app)
        .post('/api/subscriptions')
        .set('Authorization', `Bearer ${subscriberToken}`)
        .send(subscriptionData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/subscriptions', () => {
    beforeEach(async () => {
      // إنشاء اشتراك للاختبار
      await Subscription.create({
        userId: subscriberId,
        coachId: trainerId,
        planType: 'premium',
        planName: 'Test Plan',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        price: 1200,
        sessionsPerWeek: 3,
        totalSessions: 12,
        createdBy: (await User.findOne({ email: 'admin@test.com' }))._id
      });
    });

    it('should get subscriptions for admin', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.subscriptions)).toBe(true);
      expect(response.body.data.subscriptions.length).toBeGreaterThan(0);
    });

    it('should get only own subscriptions for subscriber', async () => {
      const response = await request(app)
        .get('/api/subscriptions')
        .set('Authorization', `Bearer ${subscriberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.subscriptions)).toBe(true);
    });
  });
});