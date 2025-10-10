const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async (retries = 5, delay = 5000) => {
  try {
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true
    };

    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    
    await createDefaultAdmin();
    await setupDatabaseIndexes();
    
    return conn;
  } catch (error) {
    logger.error(`Database connection failed (${retries} retries left): ${error.message}`);
    
    if (retries > 0) {
      logger.info(`Retrying connection in ${delay/1000} seconds...`);
      setTimeout(() => connectDB(retries - 1, delay), delay);
    } else {
      logger.error('Could not connect to MongoDB after multiple attempts');
      process.exit(1);
    }
  }
};

const createDefaultAdmin = async () => {
  try {
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@swimacademy.com';
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin123!';
    
    const existingAdmin = await User.findOne({ email: adminEmail, role: 'admin' });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      await User.create({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        phone: process.env.DEFAULT_ADMIN_PHONE || '+201000000000',
        status: 'active',
        emailVerified: true,
        createdBy: 'system'
      });
      
      logger.info('Default admin user created successfully');
    } else {
      logger.info('Default admin user already exists');
    }
  } catch (error) {
    logger.error('Error creating default admin:', error);
  }
};

const setupDatabaseIndexes = async () => {
  try {
    const User = require('../models/User');
    const Subscription = require('../models/Subscription');
    const TrainingSession = require('../models/TrainingSession');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ phone: 1 }, { sparse: true });
    await User.collection.createIndex({ status: 1 });
    await User.collection.createIndex({ role: 1 });
    await User.collection.createIndex({ createdAt: -1 });
    await User.collection.createIndex({ 'emergencyContact.phone': 1 }, { sparse: true });
    
    // Subscription indexes
    if (Subscription && Subscription.collection) {
      await Subscription.collection.createIndex({ userId: 1 });
      await Subscription.collection.createIndex({ status: 1 });
      await Subscription.collection.createIndex({ startDate: 1 });
      await Subscription.collection.createIndex({ endDate: 1 });
      await Subscription.collection.createIndex({ userId: 1, status: 1 });
    }
    
    // TrainingSession indexes
    if (TrainingSession && TrainingSession.collection) {
      await TrainingSession.collection.createIndex({ coachId: 1 });
      await TrainingSession.collection.createIndex({ date: 1 });
      await TrainingSession.collection.createIndex({ status: 1 });
      await TrainingSession.collection.createIndex({ poolId: 1 });
      await TrainingSession.collection.createIndex({ coachId: 1, date: 1 });
    }
    
    logger.info('Database indexes created/verified successfully');
  } catch (error) {
    logger.error('Error creating database indexes:', error);
  }
};

// Event listeners for database connection
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to database');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from database');
});

// Graceful shutdown for database
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
  } catch (error) {
    logger.error('Error during MongoDB graceful shutdown:', error);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

module.exports = connectDB;