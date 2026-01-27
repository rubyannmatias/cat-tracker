import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { recognizeCat } from '../services/recognition.js';
import { extractTextFromImage } from '../services/ocr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.use(authenticateToken);

router.post('/upload', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const photoPath = req.file.path;

    let ocrText = null;
    try {
      ocrText = await extractTextFromImage(photoPath);
    } catch (error) {
      console.error('OCR error:', error);
    }

    const result = db.prepare(`
      INSERT INTO photos (url, uploader, recognized, ocr_text)
      VALUES (?, ?, 0, ?)
    `).run(photoUrl, req.user.name, ocrText);

    const photoId = result.lastInsertRowid;

    let matches = [];
    try {
      matches = await recognizeCat(photoPath);
    } catch (error) {
      console.error('Recognition error:', error);
    }

    res.json({
      photoId,
      recognized: matches.length > 0,
      matches,
      ocrText
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

router.post('/:id/assign-by-name', (req, res) => {
  try {
    const { catName } = req.body;
    const photoId = req.params.id;

    if (!catName) {
      return res.status(400).json({ error: 'Cat name is required' });
    }

    const normalizedName = catName.trim().toLowerCase();
    const cat = db.prepare('SELECT * FROM cats WHERE LOWER(TRIM(name)) = ?').get(normalizedName);
    
    if (!cat) {
      return res.status(404).json({ error: `Cat "${catName}" not found. Please check the name or create a new profile.` });
    }

    db.prepare('UPDATE photos SET cat_id = ?, recognized = 1 WHERE id = ?').run(cat.id, photoId);

    const today = new Date().toISOString().split('T')[0];
    db.prepare('UPDATE cats SET days_not_seen = 0, last_seen_by = ?, last_seen_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      req.user.name,
      today,
      cat.id
    );

    db.prepare('INSERT INTO activity_log (volunteer_id, cat_id, action) VALUES (?, ?, ?)').run(
      req.user.id,
      cat.id,
      'assigned_photo'
    );

    const maxPhotos = parseInt(process.env.MAX_PHOTOS_PER_CAT || '7');
    const photos = db.prepare('SELECT id FROM photos WHERE cat_id = ? ORDER BY date DESC').all(cat.id);
    
    if (photos.length > maxPhotos) {
      const photosToDelete = photos.slice(maxPhotos);
      for (const photo of photosToDelete) {
        const photoData = db.prepare('SELECT url FROM photos WHERE id = ?').get(photo.id);
        if (photoData) {
          const filePath = path.join(__dirname, '../..', photoData.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        db.prepare('DELETE FROM photos WHERE id = ?').run(photo.id);
      }
    }

    res.json({ message: 'Photo assigned successfully', cat: { id: cat.id, name: cat.name } });
  } catch (error) {
    console.error('Error assigning photo by name:', error);
    res.status(500).json({ error: 'Failed to assign photo' });
  }
});

router.post('/:id/assign', (req, res) => {
  try {
    const { catId } = req.body;
    const photoId = req.params.id;

    if (!catId) {
      return res.status(400).json({ error: 'Cat ID is required' });
    }

    const cat = db.prepare('SELECT * FROM cats WHERE id = ?').get(catId);
    if (!cat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    db.prepare('UPDATE photos SET cat_id = ?, recognized = 1 WHERE id = ?').run(catId, photoId);

    const today = new Date().toISOString().split('T')[0];
    db.prepare('UPDATE cats SET days_not_seen = 0, last_seen_by = ?, last_seen_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      req.user.name,
      today,
      catId
    );

    db.prepare('INSERT INTO activity_log (volunteer_id, cat_id, action) VALUES (?, ?, ?)').run(
      req.user.id,
      catId,
      'assigned_photo'
    );

    const maxPhotos = parseInt(process.env.MAX_PHOTOS_PER_CAT || '7');
    const photos = db.prepare('SELECT id FROM photos WHERE cat_id = ? ORDER BY date DESC').all(catId);
    
    if (photos.length > maxPhotos) {
      const photosToDelete = photos.slice(maxPhotos);
      for (const photo of photosToDelete) {
        const photoData = db.prepare('SELECT url FROM photos WHERE id = ?').get(photo.id);
        if (photoData) {
          const filePath = path.join(__dirname, '../..', photoData.url);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
        db.prepare('DELETE FROM photos WHERE id = ?').run(photo.id);
      }
    }

    res.json({ message: 'Photo assigned successfully' });
  } catch (error) {
    console.error('Error assigning photo:', error);
    res.status(500).json({ error: 'Failed to assign photo' });
  }
});

router.get('/unrecognized', (req, res) => {
  try {
    const photos = db.prepare('SELECT * FROM photos WHERE recognized = 0 ORDER BY date DESC').all();
    res.json(photos);
  } catch (error) {
    console.error('Error fetching unrecognized photos:', error);
    res.status(500).json({ error: 'Failed to fetch unrecognized photos' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const filePath = path.join(__dirname, '../..', photo.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

export default router;
