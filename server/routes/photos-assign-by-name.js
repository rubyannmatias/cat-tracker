import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

router.use(authenticateToken);

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

export default router;
