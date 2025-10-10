const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('🔐 Authentication Tests', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/swimacademy_test');
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'أحمد محمد',
        email: 'ahmed@test.com',
        password: 'Test123456',
        role: 'user',
        phone: '+201012345678'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should not register user with existing email', async () => {
      const userData = {
        name: 'أحمد محمد',
        email: 'ahmed@test.com',
        password: 'Test123456',
        role: 'user'
      };

      // إنشاء المستخدم أولاً
      await User.create(userData);

      // محاولة إنشاء مستخدم بنفس البريد
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('مسجل مسبقاً');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'أ'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: 'أحمد محمد',
        email: 'ahmed@test.com',
        password: 'Test123456',
        role: 'user'
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ahmed@test.com',
          password: 'Test123456'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم تسجيل الدخول بنجاح');
      expect(response.body.data).toBeDefined();
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'ahmed@test.com',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('غير صحيحة');
    });

    it('should require email and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});