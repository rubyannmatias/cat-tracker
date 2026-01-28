# Railway Deployment Guide

## Database Management for Production

### 🔄 Automatic Database Cleanup

The app now includes automatic database cleanup and maintenance on every startup:

- **🧹 Orphaned Photos**: Removes photos pointing to deleted cats
- **🗑️ Orphaned Activities**: Cleans activity logs for deleted cats
- **🔧 Primary Photo Fix**: Ensures only one primary photo per cat
- **📊 Statistics Update**: Optimizes database performance

### 🛠️ Database Reset Option

For production issues, you can reset the database:

#### Method 1: Railway Environment Variable
```bash
# Set database reset flag
railway variables set RESET_DB=true

# Deploy
railway up

# Remove reset flag (important!)
railway variables set RESET_DB=false
railway up
```

#### Method 2: One-time Reset
```bash
# Reset and deploy in one command
RESET_DB=true railway up

# Follow with normal deployment
railway up
```

⚠️ **WARNING**: `RESET_DB=true` will delete ALL data (cats, photos, volunteers)!

### 📋 Required Environment Variables

```bash
# Core settings
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secure-secret-key

# Railway-specific paths
DATABASE_PATH=/app/data/cats.db
UPLOAD_DIR=/app/uploads

# App configuration
MAX_PHOTOS_PER_CAT=7
PHOTO_RETENTION_DAYS=30
RESET_DB=false  # Only set to true for reset
```

### 🚀 Deployment Steps

#### 1. Set Environment Variables
```bash
railway variables set JWT_SECRET=your-secure-secret-key
railway variables set DATABASE_PATH=/app/data/cats.db
railway variables set UPLOAD_DIR=/app/uploads
railway variables set NODE_ENV=production
```

#### 2. Deploy Application
```bash
railway up
```

#### 3. Verify Deployment
```bash
# Check logs
railway logs

# Test health endpoint
curl https://your-app.railway.app/api/health
```

### 🔧 Troubleshooting

#### "Update Failed" Errors
1. **Check logs**: `railway logs`
2. **Database cleanup**: Set `RESET_DB=true` and redeploy
3. **Verify schema**: Check migration logs in startup

#### Migration Issues
The app now handles migrations gracefully:
- ✅ Duplicate column errors ignored
- ✅ Schema updates applied automatically
- ✅ Fallback to previous state on errors

#### Performance Issues
- Database runs `ANALYZE` on startup for optimization
- Orphaned data cleanup improves query performance
- Indexes automatically created and maintained

### 📊 Database Schema

Current schema includes all migrations:
```sql
-- Cats table
CREATE TABLE cats (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  markings TEXT,
  gender TEXT,
  spay_neuter BOOLEAN DEFAULT 0,
  vaccinations TEXT,
  building TEXT,
  last_seen_by TEXT,
  last_seen_date DATE,
  last_fed TEXT,
  days_not_seen INTEGER DEFAULT 0,
  health_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Photos table  
CREATE TABLE photos (
  id INTEGER PRIMARY KEY,
  cat_id INTEGER,
  url TEXT NOT NULL,
  date DATETIME DEFAULT CURRENT_TIMESTAMP,
  uploader TEXT,
  recognized BOOLEAN DEFAULT 0,
  ocr_text TEXT,
  is_primary BOOLEAN DEFAULT 0,
  FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE
);

-- Volunteers table (simplified auth)
CREATE TABLE volunteers (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 🔄 Migration History

- ✅ `last_seen_date` - Track last seen dates
- ✅ `health_notes` - Medical information
- ✅ `gender` - Cat gender tracking
- ✅ `is_primary` - Primary photo selection
- ✅ Password removal - Simplified authentication

### 📱 Production Checklist

- [ ] Set all environment variables
- [ ] Test health endpoint
- [ ] Verify file uploads work
- [ ] Check photo assignment
- [ ] Test feeding updates
- [ ] Confirm PWA installation

### 🆘 Getting Help

If issues persist:
1. Check Railway logs: `railway logs`
2. Verify environment variables: `railway variables`
3. Try database reset: `RESET_DB=true railway up`
4. Check this guide for troubleshooting steps

---

**Note**: The database cleanup runs automatically on every deployment, ensuring data consistency and optimal performance.
