# Database Management Scripts

## ⚠️ WARNING
These scripts will permanently delete data. Use only for development/testing purposes.

## Available Scripts

### 1. Clear Database (`npm run clear-db`)
**Location:** `backend/scripts/clearDatabase.js`

This script will:
- Connect to your MongoDB database
- List all collections that will be cleared
- Delete all documents from every collection
- Preserve collection structure and indexes
- Provide detailed output of the clearing process

**Usage:**
```bash
cd backend
npm run clear-db
```

**What gets cleared:**
- Users
- Questions
- Answers
- Answer Versions
- Inline Comments
- Audit Logs
- Notifications
- All other application data

### 2. Seed Database (`npm run seed`)
**Location:** `backend/src/scripts/seed.js`

This script will populate the database with sample data for testing.

**Usage:**
```bash
cd backend
npm run seed
```

## Safety Measures

1. **Always backup production data** before running these scripts
2. **Verify environment** - ensure you're running against the correct database
3. **Check .env file** - confirm MONGO_URI points to the right database
4. **Development only** - these scripts are intended for development environments

## Manual Verification

Before running the clear script, you can verify your database connection:

```bash
# Check current database connection
cd backend
node -e "require('dotenv').config(); console.log('Database URI:', process.env.MONGO_URI)"
```

## Recovery

If you accidentally clear the wrong database:
1. Check if you have database backups
2. Contact your database administrator
3. Restore from the most recent backup

## Environment Variables Required

Make sure your `.env` file contains:
```
MONGODB_URI=your_mongodb_connection_string
```