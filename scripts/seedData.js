// scripts/seedData.js
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Subscription = require('../models/Subscription');
const TrainingSession = require('../models/TrainingSession');
const Progress = require('../models/Progress');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');

    // مسح البيانات القديمة
    await User.deleteMany({ email: { $ne: 'admin@swimacademy.com' } });
    await Subscription.deleteMany();
    await TrainingSession.deleteMany();
    await Progress.deleteMany();

    console.log('✅ Cleared existing data');

    // إنشاء مدربين
    const trainers = await User.create([
      {
        name: 'أحمد محمود',
        email: 'ahmed.trainer@swimacademy.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0L8k4TuBdcKZVMoFb9GQvZk9JL8cX1cJt8R5La', // password: 123456
        role: 'trainer',
        phone: '+201012345678',
        specialization: 'سباحة تنافسية',
        experience: 8,
        bio: 'مدرب سباحة محترف مع 8 سنوات خبرة في التدريب'
      },
      {
        name: 'مريم عبدالله',
        email: 'mariam.trainer@swimacademy.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0L8k4TuBdcKZVMoFb9GQvZk9JL8cX1cJt8R5La',
        role: 'trainer',
        phone: '+201012345679',
        specialization: 'لياقة بدنية',
        experience: 5,
        bio: 'مدربة لياقة بدنية متخصصة في التمارين المائية'
      }
    ]);

    console.log('✅ Created trainers');

    // إنشاء مشتركين
    const subscribers = await User.create([
      {
        name: 'محمد علي',
        email: 'mohamed.subscriber@swimacademy.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0L8k4TuBdcKZVMoFb9GQvZk9JL8cX1cJt8R5La',
        role: 'subscriber',
        phone: '+201012345680',
        birthDate: new Date('1990-05-15'),
        emergencyContact: {
          name: 'فاطمة علي',
          phone: '+201012345681',
          relation: 'زوجة'
        }
      },
      {
        name: 'سارة أحمد',
        email: 'sara.subscriber@swimacademy.com',
        password: '$2a$12$LQv3c1yqBWVHxkd0L8k4TuBdcKZVMoFb9GQvZk9JL8cX1cJt8R5La',
        role: 'subscriber',
        phone: '+201012345682',
        birthDate: new Date('1995-08-20'),
        emergencyContact: {
          name: 'خالد أحمد',
          phone: '+201012345683',
          relation: 'أخ'
        }
      }
    ]);

    console.log('✅ Created subscribers');

    // إنشاء اشتراكات
    const subscriptions = await Subscription.create([
      {
        subscriberId: subscribers[0]._id,
        planType: 'premium',
        planName: 'بريميوم - 3 جلسات أسبوعياً',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 يوم
        renewalDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000), // بعد 23 يوم
        price: 1200,
        sessionsPerWeek: 3,
        totalSessions: 12,
        trainerId: trainers[0]._id,
        status: 'active',
        paymentStatus: 'paid',
        createdBy: (await User.findOne({ email: 'admin@swimacademy.com' }))._id
      },
      {
        subscriberId: subscribers[1]._id,
        planType: 'basic',
        planName: 'أساسي - جلستين أسبوعياً',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        renewalDate: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000),
        price: 800,
        sessionsPerWeek: 2,
        totalSessions: 8,
        trainerId: trainers[1]._id,
        status: 'active',
        paymentStatus: 'paid',
        createdBy: (await User.findOne({ email: 'admin@swimacademy.com' }))._id
      }
    ]);

    console.log('✅ Created subscriptions');

    // تحديث المدربين بإضافة المتدربين
    await User.findByIdAndUpdate(trainers[0]._id, {
      $push: { trainees: subscribers[0]._id }
    });
    
    await User.findByIdAndUpdate(trainers[1]._id, {
      $push: { trainees: subscribers[1]._id }
    });

    console.log('✅ Updated trainers with trainees');

    // إنشاء جلسات تدريبية
    const sessions = await TrainingSession.create([
      {
        trainerId: trainers[0]._id,
        subscriberId: subscribers[0]._id,
        subscriptionId: subscriptions[0]._id,
        date: new Date(Date.now() + 24 * 60 * 60 * 1000), // غداً
        duration: 60,
        type: 'swimming',
        location: 'المسبح الأول',
        status: 'scheduled',
        exercises: [
          {
            name: 'إحماء',
            category: 'warmup',
            duration: 10,
            completed: false
          },
          {
            name: 'سباحة حرة',
            category: 'endurance',
            distance: 400,
            completed: false
          }
        ],
        createdBy: trainers[0]._id
      },
      {
        trainerId: trainers[1]._id,
        subscriberId: subscribers[1]._id,
        subscriptionId: subscriptions[1]._id,
        date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // بعد غد
        duration: 45,
        type: 'fitness',
        location: 'صالة اللياقة',
        status: 'scheduled',
        exercises: [
          {
            name: 'تمارين إحماء',
            category: 'warmup',
            duration: 5,
            completed: false
          },
          {
            name: 'تمارين قوة',
            category: 'strength',
            sets: 3,
            reps: '12-15',
            completed: false
          }
        ],
        createdBy: trainers[1]._id
      }
    ]);

    console.log('✅ Created training sessions');

    // إنشاء سجلات تقدم
    const progressRecords = await Progress.create([
      {
        subscriberId: subscribers[0]._id,
        trainerId: trainers[0]._id,
        type: 'weekly',
        title: 'التقييم الأسبوعي الأول',
        physicalMeasurements: {
          weight: 75,
          height: 178,
          bodyFat: 18,
          chest: 95,
          waist: 84
        },
        performanceMetrics: {
          swimming: {
            best100m: 85,
            techniqueScore: 7,
            strokesPerLength: 18
          }
        },
        goals: {
          shortTerm: [
            {
              description: 'تحسين وقت 100م سباحة حرة',
              targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              priority: 'high'
            }
          ]
        },
        lifestyle: {
          sleepQuality: 7,
          stressLevel: 5,
          hydration: 8,
          nutrition: 6,
          energyLevel: 7,
          trainingConsistency: 8
        },
        overallRating: 7,
        createdBy: trainers[0]._id
      }
    ]);

    console.log('✅ Created progress records');

    console.log('🎉 تم إنشاء البيانات التجريبية بنجاح!');
    console.log('\n📋 بيانات الدخول:');
    console.log('الأدمن: admin@swimacademy.com / admin123');
    console.log('المدرب 1: ahmed.trainer@swimacademy.com / 123456');
    console.log('المدرب 2: mariam.trainer@swimacademy.com / 123456');
    console.log('المشترك 1: mohamed.subscriber@swimacademy.com / 123456');
    console.log('المشترك 2: sara.subscriber@swimacademy.com / 123456');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();