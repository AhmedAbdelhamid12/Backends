const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const UserNew = require('../models/UserNew');

describe('Auth API', () => {
  let server;
  let testUser;
  let testUserPassword = 'Test123!';

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
  });

  afterEach(async () => {
    // Clean up test data
    await UserNew.deleteMany({});
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const userData = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'NewPass123!',
        role: 'student'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe(userData.name);
      expect(res.body.data.user.email).toBe(userData.email);
      expect(res.body.data.user.role).toBe(userData.role);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should not register a user with existing email', async () => {
      const userData = {
        name: 'New User',
        email: 'test@example.com', // Same as testUser
        password: 'NewPass123!',
        role: 'student'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('User with this email already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login an existing user', async () => {
      const loginData = {
        email: 'test@example.com',
        password: testUserPassword
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(loginData.email);
      expect(res.body.data.user).toHaveProperty('id');
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });

    it('should not login with invalid credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid credentials');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token', async () => {
      // First login to get refresh token
      const loginData = {
        email: 'test@example.com',
        password: testUserPassword
      };

      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      const refreshToken = loginRes.body.data.refreshToken;

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
    });
  });
});