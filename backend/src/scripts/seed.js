/**
 * Seed script - creates demo users and optional sample question.
 * Run: node src/scripts/seed.js (after MONGODB_URI is set)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
const { ROLES } = require('../constants/roles');
const connectDB = require('../config/db');

async function seed() {
  await connectDB();
  const existing = await User.countDocuments();
  if (existing > 0) {
    console.log('DB already has users. Skip seed or drop DB first.');
    process.exit(0);
  }
  const senior = await User.create({
    email: 'senior@example.com',
    password: 'password123',
    name: 'Dr. Senior',
    role: ROLES.SENIOR_MEMBER,
  });
  const researcher = await User.create({
    email: 'researcher@example.com',
    password: 'password123',
    name: 'Jane Researcher',
    role: ROLES.RESEARCHER,
  });
  await Question.create({
    title: 'Sample Research Question',
    description: 'Describe the impact of X on Y in the context of Z.',
    tags: ['research', 'sample'],
    difficulty: 'medium',
    status: 'draft',
    submissionDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    anonymousMode: true,
    owner: senior._id,
  });
  console.log('Created senior@example.com / researcher@example.com (password: password123)');
  console.log('Created one draft question owned by senior.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
