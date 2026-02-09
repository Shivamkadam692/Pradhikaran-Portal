/**
 * Database Clearing Script
 * WARNING: This will permanently delete all data from the database
 * Use only for development/testing purposes
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
};

// Clear all collections
const clearDatabase = async () => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`\n🗑️  Found ${collections.length} collections to clear:`);
    collections.forEach((collection, index) => {
      console.log(`  ${index + 1}. ${collection.name}`);
    });
    
    // Clear each collection
    for (const collection of collections) {
      const result = await mongoose.connection.db.collection(collection.name).deleteMany({});
      console.log(`✅ Cleared collection: ${collection.name} (${result.deletedCount} documents)`);
    }
    
    console.log('\n✨ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  }
};

// Main execution
const main = async () => {
  console.log('=== DATABASE CLEARING SCRIPT ===');
  console.log('⚠️  WARNING: This will permanently delete ALL data');
  console.log('⚠️  Make sure you have backups if this is production data\n');
  
  // Connect to database
  await connectDB();
  
  // Clear database
  await clearDatabase();
  
  // Close connection
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);
  process.exit(1);
});

// Run the script
main().catch((error) => {
  console.error('Script failed:', error);
  process.exit(1);
});