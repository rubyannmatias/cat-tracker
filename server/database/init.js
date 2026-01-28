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
  db.exec(`
    CREATE TABLE IF NOT EXISTS volunteers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
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

  // Migrations
  try {
    const tableInfo = db.prepare("PRAGMA table_info(cats)").all();
    const photosTableInfo = db.prepare("PRAGMA table_info(photos)").all();
    const hasLastSeenDate = tableInfo.some(col => col.name === 'last_seen_date');
    const hasHealthNotes = tableInfo.some(col => col.name === 'health_notes');
    const hasGender = tableInfo.some(col => col.name === 'gender');
    const hasIsPrimary = photosTableInfo.some(col => col.name === 'is_primary');
    
    if (!hasLastSeenDate) {
      console.log('Running migration: Adding last_seen_date column...');
      db.exec('ALTER TABLE cats ADD COLUMN last_seen_date DATE');
      console.log('✅ Migration completed: last_seen_date');
    }
    
    if (!hasHealthNotes) {
      console.log('Running migration: Adding health_notes column...');
      db.exec('ALTER TABLE cats ADD COLUMN health_notes TEXT');
      console.log('✅ Migration completed: health_notes');
    }
    
    if (!hasGender) {
      console.log('Running migration: Adding gender column...');
      db.exec('ALTER TABLE cats ADD COLUMN gender TEXT');
      console.log('✅ Migration completed: gender');
    }
    
    if (!hasIsPrimary) {
      console.log('Running migration: Adding is_primary column...');
      db.exec('ALTER TABLE photos ADD COLUMN is_primary BOOLEAN DEFAULT 0');
      console.log('✅ Migration completed: is_primary');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }

  console.log('✅ Database initialized');
}

export function closeDatabase() {
  db.close();
}
