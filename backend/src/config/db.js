/**
 * MongoDB connection configuration.
 * Uses Mongoose for ODM and connection pooling.
 */
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/research_collab';
  if (!process.env.MONGODB_URI) {
    console.log('Using default MONGODB_URI (set MONGODB_URI in .env to override)');
  }
  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 6+ no longer needs useNewUrlParser, useUnifiedTopology
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

module.exports = connectDB;
