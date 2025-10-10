const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Progress = require('../models/Progress');

describe('📊 Progress Tests', () => {
  let adminToken;
  let trainerToken;
  let subscriberToken;
  let trainerId;
  let subscriberId;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany();
    await Progress.deleteMany();

    // إنشاء مستخدمين للاختبار
    const admin = await User.create({
      name: 'مدير النظام',
      email: 'admin@test.com',
      password: '123456',
      role: 'admin'
    });

    const trainer = await User.create({
      name: 'مدرب Test',
      email: 'trainer@test.com',
      password: '123456',
      role: 'trainer',
      specialization: 'سباحة'
    });
    trainerId = trainer._id;

    const subscriber = await User.create({
      name: 'مشترك Test',
      email: 'subscriber@test.com',
      password: '123456',
      role: 'subscriber'
    });
    subscriberId = subscriber._id;

    // تحديث المدرب بإضافة المتدرب
    await User.findByIdAndUpdate(trainerId, {
      $push: { trainees: subscriberId }
    });

    // الحصول على التوكنات
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: '123456' });
    adminToken = adminLogin.body.token;

    const trainerLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'trainer@test.com', password: '123456' });
    trainerToken = trainerLogin.body.token;

    const subscriberLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'subscriber@test.com', password: '123456' });
    subscriberToken = subscriberLogin.body.token;
  });

  describe('POST /api/progress', () => {
    it('should record progress as trainer', async () => {
      const progressData = {
        subscriberId: subscriberId.toString(),
        type: 'weekly',
        title: 'التقييم الأسبوعي',
        physicalMeasurements: {
          weight: 75,
          height: 178,
          bodyFat: 18
        },
        performanceMetrics: {
          swimming: {
            best100m: 85,
            techniqueScore: 7
          }
        }
      };

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${trainerToken}`)
        .send(progressData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(progressData.title);
      expect(response.body.data.physicalMeasurements.weight).toBe(75);
    });

    it('should not allow subscriber to record progress', async () => {
      const progressData = {
        subscriberId: subscriberId.toString(),
        type: 'weekly',
        title: 'تقييم شخصي'
      };

      const response = await request(app)
        .post('/api/progress')
        .set('Authorization', `Bearer ${subscriberToken}`)
        .send(progressData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/progress', () => {
    beforeEach(async () => {
      // إنشاء سجل تقدم للاختبار
      await Progress.create({
        subscriberId,
        trainerId,
        type: 'weekly',
        title: 'Test Progress',
        physicalMeasurements: {
          weight: 75,
          height: 178
        },
        createdBy: trainerId
      });
    });

    it('should get progress records for trainer', async () => {
      const response = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${trainerToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should get progress records for subscriber', async () => {
      const response = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${subscriberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });
  });
});