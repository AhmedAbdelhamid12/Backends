const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const UserNew = require('../models/UserNew');

describe('Users API', () => {
  let server;
  let testUser;
  let testUserPassword = 'Test123!';
  let authToken;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/academy-multi-m-test';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    server = app.listen(0);
  });

  afterAll(async () => {
    // Clean up test data
    await UserNew.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    // Create a test user
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(testUserPassword, salt);

    testUser = await UserNew.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash,
      role: 'student'
    });

    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: testUserPassword
      });

    authToken = loginRes.body.data.accessToken;
  });

  afterEach(async () => {
    // Clean up test data
    await UserNew.deleteMany({});
  });

  describe('GET /api/v1/users/me', () => {
    it('should get current user data', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.user.name).toBe('Test User');
      expect(res.body.data.user.role).toBe('student');
    });

    it('should not get user data without authentication', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access denied. No token provided.');
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should update current user data', async () => {
      const updateData = {
        name: 'Updated Name',
        theme: 'dark'
      };

      const res = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(updateData.name);
      expect(res.body.data.user.theme).toBe(updateData.theme);
    });

    it('should not update user data without authentication', async () => {
      const updateData = {
        name: 'Updated Name'
      };

      const res = await request(app)
        .patch('/api/v1/users/me')
        .send(updateData)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access denied. No token provided.');
    });
  });
});