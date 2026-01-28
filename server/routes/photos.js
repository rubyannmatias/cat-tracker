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
import heicConvert from 'heic-convert';

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
    const allowedExtensions = /\.(jpeg|jpg|png|gif|webp|heic|heif)$/i;
    const extname = allowedExtensions.test(file.originalname.toLowerCase());
    
    // Check MIME type - be permissive for HEIC since browsers often send wrong MIME
    const allowedMimeTypes = /^image\/(jpeg|jpg|png|gif|webp|heic|heif)$/i;
    const validMime = allowedMimeTypes.test(file.mimetype) || 
                      file.mimetype === 'image/heic' || 
                      file.mimetype === 'image/heif' ||
                      file.mimetype === 'application/octet-stream'; // HEIC often comes as this
    
    // Accept if extension is valid OR if both extension and mime are acceptable
    if (extname) {
      console.log(`File accepted: ${file.originalname} (${file.mimetype})`);
      cb(null, true);
    } else {
      console.log(`File rejected: ${file.originalname} (${file.mimetype})`);
      cb(new Error(`Only image files are allowed. Received: ${file.originalname}`));
    }
  }
});

router.use(authenticateToken);

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  console.error('=== MULTER ERROR ===');
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
};

router.post('/upload', upload.single('photo'), handleUploadError, async (req, res) => {
  console.log('=== PHOTO UPLOAD REQUEST RECEIVED ===');
  try {
    console.log('Request file:', req.file ? {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    } : 'NO FILE');
    
    if (!req.file) {
      console.error('ERROR: No file in request');
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    let photoUrl = `/uploads/${req.file.filename}`;
    let photoPath = req.file.path;
    console.log('Photo URL:', photoUrl);
    console.log('Photo path:', photoPath);

    // Convert HEIC to JPG if needed (server-side)
    const isHEIC = /\.(heic|heif)$/i.test(req.file.originalname);
    console.log('HEIC detection:', {
      filename: req.file.originalname,
      isHEIC: isHEIC
    });
    
    if (isHEIC) {
      try {
        console.log('Converting HEIC to JPG on server...');
        const inputBuffer = await fs.promises.readFile(photoPath);
        const outputBuffer = await heicConvert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 0.9
        });
        
        // Create new filename with .jpg extension
        const jpgFilename = req.file.filename.replace(/\.(heic|heif)$/i, '.jpg');
        const jpgPath = path.join(uploadDir, jpgFilename);
        
        // Write converted file
        await fs.promises.writeFile(jpgPath, outputBuffer);
        console.log('HEIC converted to JPG:', jpgFilename);
        
        // Delete original HEIC file
        await fs.promises.unlink(photoPath);
        console.log('Original HEIC file deleted');
        
        // Update paths to use JPG
        photoPath = jpgPath;
        photoUrl = `/uploads/${jpgFilename}`;
      } catch (conversionError) {
        console.error('HEIC conversion error:', conversionError);
        throw new Error('Failed to convert HEIC image: ' + conversionError.message);
      }
    }

    let ocrText = null;
    
    try {
      console.log('Starting OCR...');
      ocrText = await extractTextFromImage(photoPath);
      console.log('OCR completed:', ocrText ? 'text found' : 'no text');
    } catch (error) {
      console.error('OCR error:', error.message);
      // Don't crash on OCR errors, just skip OCR
      console.log('Continuing without OCR due to error');
    }

    console.log('Inserting photo into database...');
    const result = db.prepare(`
      INSERT INTO photos (url, uploader, recognized, ocr_text)
      VALUES (?, ?, 0, ?)
    `).run(photoUrl, req.user.name, ocrText);

    const photoId = result.lastInsertRowid;
    console.log('Photo inserted with ID:', photoId);

    let matches = [];
    try {
      console.log('Starting cat recognition...');
      matches = await recognizeCat(photoPath);
      console.log('Recognition completed, matches:', matches.length);
    } catch (error) {
      console.error('Recognition error:', error.message);
      console.error('Recognition stack:', error.stack);
    }

    console.log('Sending response...');
    res.json({
      photoId,
      photoUrl,
      recognized: matches.length > 0,
      matches,
      ocrText
    });
    console.log('=== UPLOAD COMPLETED SUCCESSFULLY ===');
  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Ensure we always send JSON response
    if (!res.headersSent) {
      return res.status(500).json({ 
        error: 'Failed to upload photo: ' + error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
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
    const photos = db.prepare(`
      SELECT * FROM photos 
      WHERE recognized = 0 AND cat_id IS NULL
      ORDER BY date DESC
    `).all();
    
    res.json(photos);
  } catch (error) {
    console.error('Error fetching unrecognized photos:', error);
    res.status(500).json({ error: 'Failed to fetch unrecognized photos' });
  }
});

router.delete('/unrecognized/:id', (req, res) => {
  try {
    const photoId = req.params.id;
    
    // Get photo details before deleting
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Delete the physical file
    const filePath = path.join(__dirname, '../..', photo.url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('Deleted file:', filePath);
    }
    
    // Delete from database
    db.prepare('DELETE FROM photos WHERE id = ?').run(photoId);
    console.log('Deleted photo from database:', photoId);
    
    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Delete the physical file
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

router.patch('/:id/set-primary', (req, res) => {
  try {
    const photoId = req.params.id;
    
    // Get the photo and verify it exists
    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }
    
    // Remove primary status from all other photos for this cat
    db.prepare('UPDATE photos SET is_primary = 0 WHERE cat_id = ?').run(photo.cat_id);
    
    // Set this photo as primary
    db.prepare('UPDATE photos SET is_primary = 1 WHERE id = ?').run(photoId);
    
    // Log the action
    db.prepare('INSERT INTO activity_log (volunteer_id, cat_id, action) VALUES (?, ?, ?)').run(
      req.user.id,
      photo.cat_id,
      'set_primary_photo'
    );
    
    res.json({ message: 'Primary photo set successfully' });
  } catch (error) {
    console.error('Error setting primary photo:', error);
    res.status(500).json({ error: 'Failed to set primary photo' });
  }
});

export default router;
