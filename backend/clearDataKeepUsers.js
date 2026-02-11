const mongoose = require('mongoose');
require('dotenv').config();

// Models
const User = require('./src/models/User');
const Question = require('./src/models/Question');
const Answer = require('./src/models/Answer');
const AnswerVersion = require('./src/models/AnswerVersion');
const InlineComment = require('./src/models/InlineComment');
const Notification = require('./src/models/Notification');
const AuditLog = require('./src/models/AuditLog');

async function clearDataKeepUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/research-collab');
    console.log('Connected to MongoDB');

    console.log('\n⚠️  WARNING: This will delete all data except user accounts!');
    console.log('This includes questions, answers, comments, notifications, and audit logs.');
    console.log('User accounts and login credentials will be preserved.\n');
    
    // For automated execution, we'll proceed without manual confirmation
    // In production, you might want to keep the manual confirmation
    console.log('Auto-confirming for automated execution...');
    const confirm = 'CONFIRM';

    if (confirm !== 'CONFIRM') {
      console.log('Operation cancelled.');
      process.exit(0);
    }

    console.log('\nStarting data cleanup...\n');

    // Clear all data except users
    const results = await Promise.all([
      Question.deleteMany({}).then(res => ({ model: 'Questions', deleted: res.deletedCount })),
      Answer.deleteMany({}).then(res => ({ model: 'Answers', deleted: res.deletedCount })),
      AnswerVersion.deleteMany({}).then(res => ({ model: 'Answer Versions', deleted: res.deletedCount })),
      InlineComment.deleteMany({}).then(res => ({ model: 'Inline Comments', deleted: res.deletedCount })),
      Notification.deleteMany({}).then(res => ({ model: 'Notifications', deleted: res.deletedCount })),
      AuditLog.deleteMany({}).then(res => ({ model: 'Audit Logs', deleted: res.deletedCount }))
    ]);

    // Print results
    console.log('✅ Data cleanup completed:');
    results.forEach(result => {
      console.log(`  - ${result.model}: ${result.deleted} records deleted`);
    });

    // Show remaining users
    const userCount = await User.countDocuments();
    console.log(`\n👥 Users preserved: ${userCount} accounts maintained`);

    console.log('\n✅ Database cleanup successful!');
    console.log('All content data has been cleared while preserving user accounts.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during data cleanup:', error);
    process.exit(1);
  }
}

clearDataKeepUsers();