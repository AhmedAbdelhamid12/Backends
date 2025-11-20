const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const app = require('../server');
const UserNew = require('../models/UserNew');
const CourseNew = require('../models/CourseNew');

describe('Courses API', () => {
  let server;
  let adminUser;
  let studentUser;
  let adminAuthToken;
  let studentAuthToken;
  let testCourse;

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
    await CourseNew.deleteMany({});
    await mongoose.connection.close();
    server.close();
  });

  beforeEach(async () => {
    // Create admin user
    const adminSalt = await bcrypt.genSalt(12);
    const adminPasswordHash = await bcrypt.hash('Admin123!', adminSalt);

    adminUser = await UserNew.create({
      name: 'Admin User',
      email: 'admin@example.com',
      passwordHash: adminPasswordHash,
      role: 'admin'
    });

    // Create student user
    const studentSalt = await bcrypt.genSalt(12);
    const studentPasswordHash = await bcrypt.hash('Student123!', studentSalt);

    studentUser = await UserNew.create({
      name: 'Student User',
      email: 'student@example.com',
      passwordHash: studentPasswordHash,
      role: 'student'
    });

    // Login to get auth tokens
    const adminLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!'
      });

    adminAuthToken = adminLoginRes.body.data.accessToken;

    const studentLoginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'student@example.com',
        password: 'Student123!'
      });

    studentAuthToken = studentLoginRes.body.data.accessToken;

    // Create a test course
    testCourse = await CourseNew.create({
      title: 'Test Course',
      slug: 'test-course',
      description: 'This is a test course',
      price: 99.99,
      published: true
    });
  });

  afterEach(async () => {
    // Clean up test data
    await UserNew.deleteMany({});
    await CourseNew.deleteMany({});
  });

  describe('GET /api/v1/courses', () => {
    it('should get all courses', async () => {
      const res = await request(app)
        .get('/api/v1/courses')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.courses.length).toBe(1);
      expect(res.body.data.courses[0].title).toBe('Test Course');
    });
  });

  describe('GET /api/v1/courses/:slug', () => {
    it('should get a course by slug', async () => {
      const res = await request(app)
        .get('/api/v1/courses/test-course')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.course.title).toBe('Test Course');
      expect(res.body.data.course.slug).toBe('test-course');
    });

    it('should not get an unpublished course for non-admin users', async () => {
      // Create unpublished course
      await CourseNew.create({
        title: 'Unpublished Course',
        slug: 'unpublished-course',
        description: 'This is an unpublished course',
        price: 49.99,
        published: false
      });

      const res = await request(app)
        .get('/api/v1/courses/unpublished-course')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Course not found');
    });
  });

  describe('POST /api/v1/courses', () => {
    it('should create a new course as admin', async () => {
      const courseData = {
        title: 'New Course',
        slug: 'new-course',
        description: 'This is a new course',
        price: 149.99,
        published: true
      };

      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(courseData)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.course.title).toBe(courseData.title);
      expect(res.body.data.course.slug).toBe(courseData.slug);
    });

    it('should not create a course as student', async () => {
      const courseData = {
        title: 'New Course',
        slug: 'new-course',
        description: 'This is a new course',
        price: 149.99,
        published: true
      };

      const res = await request(app)
        .post('/api/v1/courses')
        .set('Authorization', `Bearer ${studentAuthToken}`)
        .send(courseData)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access denied. Insufficient permissions.');
    });
  });

  describe('PATCH /api/v1/courses/:id', () => {
    it('should update a course as admin', async () => {
      const updateData = {
        title: 'Updated Course',
        price: 199.99
      };

      const res = await request(app)
        .patch(`/api/v1/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${adminAuthToken}`)
        .send(updateData)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.course.title).toBe(updateData.title);
      expect(res.body.data.course.price).toBe(updateData.price);
    });

    it('should not update a course as student', async () => {
      const updateData = {
        title: 'Updated Course',
        price: 199.99
      };

      const res = await request(app)
        .patch(`/api/v1/courses/${testCourse._id}`)
        .set('Authorization', `Bearer ${studentAuthToken}`)
        .send(updateData)
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Access denied. Insufficient permissions.');
    });
  });
});