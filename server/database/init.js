import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/cats.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);

export function initDatabase() {
  // Enable foreign key constraints
  db.exec('PRAGMA foreign_keys = ON');
  
  db.exec(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cat_id INTEGER,
      url TEXT NOT NULL,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploader TEXT,
      recognized BOOLEAN DEFAULT 0,
      ocr_text TEXT,
      is_primary BOOLEAN DEFAULT 0,
      FOREIGN KEY (cat_id) REFERENCES cats(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      volunteer_id INTEGER,
      cat_id INTEGER,
      action TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (volunteer_id) REFERENCES volunteers(id),
      FOREIGN KEY (cat_id) REFERENCES cats(id)
    );

    CREATE INDEX IF NOT EXISTS idx_photos_cat_id ON photos(cat_id);
    CREATE INDEX IF NOT EXISTS idx_photos_recognized ON photos(recognized);
    CREATE INDEX IF NOT EXISTS idx_activity_volunteer ON activity_log(volunteer_id);
  `);

  // Database cleanup and maintenance
  try {
    console.log('🧹 Running database cleanup...');
    
    // Clean up orphaned photos (photos without valid cat_id)
    const orphanedPhotos = db.prepare(`
      SELECT COUNT(*) as count FROM photos 
      WHERE cat_id IS NOT NULL AND cat_id NOT IN (SELECT id FROM cats)
    `).get();
    
    if (orphanedPhotos.count > 0) {
      console.log(`🗑️ Cleaning up ${orphanedPhotos.count} orphaned photos...`);
      db.prepare(`
        DELETE FROM photos 
        WHERE cat_id IS NOT NULL AND cat_id NOT IN (SELECT id FROM cats)
      `).run();
      console.log('✅ Orphaned photos cleaned up');
    }
    
    // Clean up activity log for deleted cats
    const orphanedActivities = db.prepare(`
      SELECT COUNT(*) as count FROM activity_log 
      WHERE cat_id NOT IN (SELECT id FROM cats)
    `).get();
    
    if (orphanedActivities.count > 0) {
      console.log(`🗑️ Cleaning up ${orphanedActivities.count} orphaned activities...`);
      db.prepare(`
        DELETE FROM activity_log 
        WHERE cat_id NOT IN (SELECT id FROM cats)
      `).run();
      console.log('✅ Orphaned activities cleaned up');
    }
    
    // Reset primary photo flags if multiple exist per cat
    const duplicatePrimaries = db.prepare(`
      SELECT cat_id, COUNT(*) as count FROM photos 
      WHERE is_primary = 1 GROUP BY cat_id HAVING count > 1
    `).all();
    
    if (duplicatePrimaries.length > 0) {
      console.log(`🔧 Fixing ${duplicatePrimaries.length} cats with multiple primary photos...`);
      duplicatePrimaries.forEach(cat => {
        // Keep only the first photo as primary, reset others
        db.prepare(`
          UPDATE photos SET is_primary = 0 
          WHERE cat_id = ? AND id != (
            SELECT id FROM (SELECT id FROM photos WHERE cat_id = ? AND is_primary = 1 LIMIT 1)
          )
        `).run(cat.cat_id, cat.cat_id);
      });
      console.log('✅ Primary photo flags fixed');
    }
    
    // Update database statistics
    db.exec('ANALYZE');
    console.log('✅ Database statistics updated');
    
  } catch (error) {
    console.error('Database cleanup error:', error);
  }

  // Robust migrations with better error handling
  try {
    console.log('🔄 Running database migrations...');
    
    const tableInfo = db.prepare("PRAGMA table_info(cats)").all();
    const photosTableInfo = db.prepare("PRAGMA table_info(photos)").all();
    const volunteersTableInfo = db.prepare("PRAGMA table_info(volunteers)").all();
    
    const hasLastSeenDate = tableInfo.some(col => col.name === 'last_seen_date');
    const hasHealthNotes = tableInfo.some(col => col.name === 'health_notes');
    const hasGender = tableInfo.some(col => col.name === 'gender');
    const hasIsPrimary = photosTableInfo.some(col => col.name === 'is_primary');
    
    // Cats table migrations
    if (!hasLastSeenDate) {
      console.log('Running migration: Adding last_seen_date column...');
      try {
        db.exec('ALTER TABLE cats ADD COLUMN last_seen_date DATE');
        console.log('✅ Migration completed: last_seen_date');
      } catch (error) {
        if (!error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }
    
    if (!hasHealthNotes) {
      console.log('Running migration: Adding health_notes column...');
      try {
        db.exec('ALTER TABLE cats ADD COLUMN health_notes TEXT');
        console.log('✅ Migration completed: health_notes');
      } catch (error) {
        if (!error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }
    
    if (!hasGender) {
      console.log('Running migration: Adding gender column...');
      try {
        db.exec('ALTER TABLE cats ADD COLUMN gender TEXT');
        console.log('✅ Migration completed: gender');
      } catch (error) {
        if (!error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }
    
    // Photos table migrations
    if (!hasIsPrimary) {
      console.log('Running migration: Adding is_primary column...');
      try {
        db.exec('ALTER TABLE photos ADD COLUMN is_primary BOOLEAN DEFAULT 0');
        console.log('✅ Migration completed: is_primary');
      } catch (error) {
        if (!error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }
    
    // Volunteers table migrations
    const hasUsername = volunteersTableInfo.some(col => col.name === 'username');
    const hasPasswordHash = volunteersTableInfo.some(col => col.name === 'password_hash');
    const hasOldPassword = volunteersTableInfo.some(col => col.name === 'password');
    const hasEmail = volunteersTableInfo.some(col => col.name === 'email');
    
    if (!hasUsername) {
      console.log('Running migration: Adding username column...');
      try {
        db.exec('ALTER TABLE volunteers ADD COLUMN username TEXT');
        console.log('✅ Migration completed: username column added');
        
        // Generate usernames from existing names
        const volunteers = db.prepare('SELECT id, name FROM volunteers WHERE username IS NULL').all();
        volunteers.forEach(volunteer => {
          const username = volunteer.name.toLowerCase().replace(/\s+/g, '_') + '_' + volunteer.id;
          db.prepare('UPDATE volunteers SET username = ? WHERE id = ?').run(username, volunteer.id);
        });
        console.log(`✅ Generated usernames for ${volunteers.length} existing volunteers`);
      } catch (error) {
        if (!error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }
    
    if (!hasPasswordHash) {
      console.log('Running migration: Adding password_hash column...');
      try {
        db.exec('ALTER TABLE volunteers ADD COLUMN password_hash TEXT');
        console.log('✅ Migration completed: password_hash column added');
        
        // Set temporary passwords for existing users
        const volunteers = db.prepare('SELECT id, username FROM volunteers WHERE password_hash IS NULL').all();
        volunteers.forEach(volunteer => {
          const tempPassword = 'temp123'; // Users should change this
          const bcrypt = require('bcrypt');
          const hash = bcrypt.hashSync(tempPassword, 10);
          db.prepare('UPDATE volunteers SET password_hash = ? WHERE id = ?').run(hash, volunteer.id);
        });
        console.log(`✅ Set temporary passwords for ${volunteers.length} existing volunteers`);
      } catch (error) {
        if (!error.message.includes('duplicate column name')) {
          throw error;
        }
      }
    }
    
    // Ensure email column allows NULL values
    if (hasEmail) {
      console.log('Checking email column constraints...');
      try {
        // Check if email column has NOT NULL constraint by trying to recreate it
        // SQLite doesn't support ALTER COLUMN directly, so we need to recreate the table
        const tableInfo = db.prepare("PRAGMA table_info(volunteers)").all();
        const emailCol = tableInfo.find(col => col.name === 'email');
        
        if (emailCol && emailCol.notnull === 1) {
          console.log('Email column has NOT NULL constraint, fixing...');
          
          // Clean up any existing backup table first
          try {
            db.exec('DROP TABLE IF EXISTS volunteers_backup');
          } catch (error) {
            // Ignore if table doesn't exist
          }
          
          // Create backup table
          db.exec(`
            CREATE TABLE volunteers_backup AS SELECT * FROM volunteers
          `);
          
          // Drop original table
          db.exec('DROP TABLE volunteers');
          
          // Recreate table with correct email column
          db.exec(`
            CREATE TABLE volunteers (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT UNIQUE NOT NULL,
              password_hash TEXT NOT NULL,
              name TEXT NOT NULL,
              email TEXT UNIQUE,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `);
          
          // Restore data
          db.exec(`
            INSERT INTO volunteers (id, username, password_hash, name, email, created_at)
            SELECT id, username, password_hash, name, email, created_at FROM volunteers_backup
          `);
          
          // Drop backup table
          db.exec('DROP TABLE volunteers_backup');
          
          console.log('✅ Email column constraint fixed');
        } else {
          console.log('Email column already allows NULL values');
        }
      } catch (error) {
        console.log('Email column check failed:', error.message);
      }
    }

    // Remove old password column if it exists
    if (hasOldPassword) {
      console.log('Running migration: Removing old password column...');
      try {
        db.exec('ALTER TABLE volunteers DROP COLUMN password');
        console.log('✅ Migration completed: old password column removed');
      } catch (error) {
        if (!error.message.includes('no such column')) {
          throw error;
        }
      }
    }
    
    console.log('✅ All migrations completed');
    
  } catch (error) {
    console.error('Migration error:', error);
    // Don't throw - allow app to continue even if migrations fail
  }

  console.log('✅ Database initialized');
}

// Clean slate database reset - removes all data and recreates tables
export function resetDatabase() {
  if (process.env.RESET_DB === 'true') {
    console.log('🔄 Resetting database to clean slate...');
    try {
      // Drop all tables to recreate with correct schema
      db.exec('DROP TABLE IF EXISTS activity_log');
      db.exec('DROP TABLE IF EXISTS photos');
      db.exec('DROP TABLE IF EXISTS cats');
      db.exec('DROP TABLE IF EXISTS volunteers');
      
      // Reset auto-increment counters
      db.exec("DELETE FROM sqlite_sequence WHERE name IN ('cats', 'photos', 'volunteers', 'activity_log')");
      
      console.log('✅ Database reset completed - clean slate created');
      
      return true;
    } catch (error) {
      console.error('Database reset error:', error);
      throw error;
    }
  }
  return false;
}

// Database migration - preserves data but updates schema
export function migrateDatabase() {
  if (process.env.MIGRATE_DB === 'true') {
    console.log('🔄 Migrating database with data preservation...');
    try {
      // Backup current data
      const backup = {
        cats: db.prepare('SELECT * FROM cats').all(),
        photos: db.prepare('SELECT * FROM photos').all(),
        volunteers: db.prepare('SELECT * FROM volunteers').all()
      };
      
      // Drop all tables to recreate with correct schema
      db.exec('DROP TABLE IF EXISTS activity_log');
      db.exec('DROP TABLE IF EXISTS photos');
      db.exec('DROP TABLE IF EXISTS cats');
      db.exec('DROP TABLE IF EXISTS volunteers');
      
      // Reset auto-increment counters
      db.exec("DELETE FROM sqlite_sequence WHERE name IN ('cats', 'photos', 'volunteers', 'activity_log')");
      
      console.log('✅ Database migration completed - schema updated');
      console.log(`📊 Preserved ${backup.cats.length} cats, ${backup.photos.length} photos, ${backup.volunteers.length} volunteers`);
      
      // Restore preserved data
      if (backup.cats.length > 0) {
        console.log('📥 Restoring cats data...');
        backup.cats.forEach(cat => {
          db.prepare(`
            INSERT INTO cats (name, markings, gender, spay_neuter, vaccinations, health_notes, building, last_seen_by, last_seen_date, last_fed, days_not_seen, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            cat.name, cat.markings, cat.gender, cat.spay_neuter, cat.vaccinations, 
            cat.health_notes, cat.building, cat.last_seen_by, cat.last_seen_date, 
            cat.last_fed, cat.days_not_seen, cat.created_at, cat.updated_at
          );
        });
      }
      
      if (backup.photos.length > 0) {
        console.log('📥 Restoring photos data...');
        backup.photos.forEach(photo => {
          db.prepare(`
            INSERT INTO photos (cat_id, url, date, uploader, recognized, ocr_text, is_primary)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            photo.cat_id, photo.url, photo.date, photo.uploader, 
            photo.recognized, photo.ocr_text, photo.is_primary
          );
        });
      }
      
      if (backup.volunteers.length > 0) {
        console.log('📥 Restoring volunteers data...');
        backup.volunteers.forEach(volunteer => {
          db.prepare(`
            INSERT INTO volunteers (username, password_hash, name, email, created_at)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            volunteer.username, volunteer.password_hash, volunteer.name, 
            volunteer.email, volunteer.created_at
          );
        });
      }
      
      console.log('✅ All data restored successfully');
      return backup;
    } catch (error) {
      console.error('Database migration error:', error);
      throw error;
    }
  }
  return null;
}

export function closeDatabase() {
  db.close();
}
