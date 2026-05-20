/**
 * Seed Script — creates a default admin account
 * Run once: node seed.js
 * Then delete or keep it, but never run it again on a live DB
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('  Admin already exists. Skipping seed.');
      process.exit(0);
    }

    // Create default admin
    await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'Admin@123',   // ← Change this immediately after first login!
      role: 'admin',
    });

    // Create a sample vendor
    await User.create({
      name: 'Sample Vendor',
      email: 'vendor@example.com',
      password: 'Vendor@123',
      role: 'vendor',
    });

    // Create a sample user
    await User.create({
      name: 'Sample User',
      email: 'user@example.com',
      password: 'User@123',
      role: 'user',
    });

    console.log(' Seed complete! Accounts created:');
    console.log('   Admin:  admin@example.com  /  Admin@123');
    console.log('   Vendor: vendor@example.com /  Vendor@123');
    console.log('   User:   user@example.com   /  User@123');
    console.log('\n Please change these passwords after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
};

seed();
