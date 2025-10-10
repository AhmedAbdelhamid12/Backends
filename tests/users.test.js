const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('👥 Users Tests', () => {
  let adminToken;
  let trainerToken;
  let subscriberToken;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swimacademy_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany();

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

    const subscriber = await User.create({
      name: 'مشترك Test',
      email: 'subscriber@test.com',
      password: 'Test123456',
      role: 'user'
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

  describe('GET /api/users', () => {
    it('should get all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.pagination).toBeDefined();
    });

    it('should not allow non-admin to get all users', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${subscriberToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const users = await User.find();
      const userId = users[0]._id;

      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).toHaveProperty('_id');
    });

    it('should allow users to get their own data', async () => {
      const users = await User.find({ role: 'user' });
      const subscriberId = users[0]._id;

      const response = await request(app)
        .get(`/api/users/${subscriberId}`)
        .set('Authorization', `Bearer ${subscriberToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user data', async () => {
      const users = await User.find({ role: 'user' });
      const subscriberId = users[0]._id;

      const updateData = {
        name: 'اسم محدث',
        phone: '+201098765432'
      };

      const response = await request(app)
        .put(`/api/users/${subscriberId}`)
        .set('Authorization', `Bearer ${subscriberToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });
  });
});