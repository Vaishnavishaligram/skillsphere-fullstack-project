// Seed script - creates an initial admin account
// Run with: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('An admin user already exists:', existingAdmin.email);
      process.exit(0);
    }

    const admin = await User.create({
      name: 'Platform Admin',
      email: process.env.SEED_ADMIN_EMAIL || 'admin@skillsphere.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'admin',
      isEmailVerified: true,
    });

    console.log('Admin user created:');
    console.log(`  Email: ${admin.email}`);
    console.log(`  Password: ${process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!'}`);
    console.log('  IMPORTANT: Change this password immediately after first login.');

    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exit(1);
  }
};

seed();
