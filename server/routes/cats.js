import express from 'express';
import { db } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', (req, res) => {
  try {
    const cats = db.prepare(`
      SELECT c.*, 
             (SELECT COUNT(*) FROM photos WHERE cat_id = c.id) as photo_count
      FROM cats c
      ORDER BY c.days_not_seen ASC, c.name ASC
    `).all();

    const catsWithPhotos = cats.map(cat => {
      const photos = db.prepare('SELECT * FROM photos WHERE cat_id = ? ORDER BY date DESC').all(cat.id);
      return {
        ...cat,
        spayNeuter: Boolean(cat.spay_neuter),
        photos
      };
    });

    res.json(catsWithPhotos);
  } catch (error) {
    console.error('Error fetching cats:', error);
    res.status(500).json({ error: 'Failed to fetch cats' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const cat = db.prepare('SELECT * FROM cats WHERE id = ?').get(req.params.id);
    
    if (!cat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    console.log('Fetching cat with ID:', req.params.id);
    console.log('Cat data:', cat);

    const photosQuery = 'SELECT * FROM photos WHERE cat_id = ? ORDER BY date DESC';
    console.log('Running photos query:', photosQuery, 'with cat_id:', cat.id);
    
    const photos = db.prepare(photosQuery).all(cat.id);
    console.log('Photos found for cat:', photos);
    console.log('Photos count:', photos.length);
    
    // Also check all photos in database for debugging
    const allPhotos = db.prepare('SELECT id, cat_id, url FROM photos ORDER BY id DESC LIMIT 5').all();
    console.log('Recent photos in database:', allPhotos);

    const responseData = {
      ...cat,
      spayNeuter: Boolean(cat.spay_neuter),
      photos
    };
    
    console.log('Response data being sent:', responseData);
    res.json(responseData);
  } catch (error) {
    console.error('Error fetching cat:', error);
    res.status(500).json({ error: 'Failed to fetch cat' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, markings, building, gender, spayNeuter, vaccinations, healthNotes, photoId } = req.body;
    
    console.log('Cat creation request received:', { name, photoId, spayNeuter, vaccinations });

    if (!name) {
      return res.status(400).json({ error: 'Cat name is required' });
    }

    const normalizedName = name.trim().toLowerCase();
    const existingCat = db.prepare('SELECT id, name FROM cats WHERE LOWER(TRIM(name)) = ?').get(normalizedName);
    
    if (existingCat) {
      return res.status(400).json({ error: `A cat named "${existingCat.name}" already exists. Please use a different name.` });
    }

    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();
    const result = db.prepare(`
      INSERT INTO cats (name, markings, building, gender, spay_neuter, vaccinations, health_notes, last_seen_by, last_seen_date, days_not_seen, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), markings || null, building || null, gender || null, spayNeuter ? 1 : 0, vaccinations || null, healthNotes || null, req.user.name, today, 0, now, now);

    console.log('Database insert result:', result);
    console.log('Last insert row ID:', result.lastInsertRowid);

    if (photoId) {
      console.log('Assigning photo ID:', photoId, 'to cat ID:', result.lastInsertRowid);
      db.prepare('UPDATE photos SET cat_id = ?, recognized = 1 WHERE id = ?').run(result.lastInsertRowid, photoId);
      console.log('Photo assignment completed');
      
      // Verify the assignment
      const verifyPhoto = db.prepare('SELECT * FROM photos WHERE id = ?').get(photoId);
      console.log('Verification - Photo after assignment:', verifyPhoto);
      
      // Also verify by querying cat photos
      const catPhotos = db.prepare('SELECT * FROM photos WHERE cat_id = ?').all(result.lastInsertRowid);
      console.log('Verification - All photos for cat:', catPhotos);
    } else {
      console.log('No photoId provided for cat creation');
    }

    const cat = db.prepare('SELECT * FROM cats WHERE id = ?').get(result.lastInsertRowid);
    
    console.log('Cat created:', cat);
    console.log('User ID:', req.user?.id);
    console.log('Cat ID:', cat?.id);

    if (!req.user?.id) {
      console.error('User ID is missing from request');
      return res.status(401).json({ error: 'User authentication required' });
    }
    
    if (!cat?.id) {
      console.error('Cat ID is missing after creation');
      return res.status(500).json({ error: 'Failed to create cat record' });
    }

    db.prepare('INSERT INTO activity_log (volunteer_id, cat_id, action) VALUES (?, ?, ?)').run(
      req.user.id,
      cat.id,
      'created_cat'
    );

    res.status(201).json({
      ...cat,
      spayNeuter: Boolean(cat.spay_neuter)
    });
  } catch (error) {
    console.error('Error creating cat:', error);
    res.status(500).json({ error: 'Failed to create cat' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const { name, markings, building, gender, spayNeuter, vaccinations, lastSeenBy, daysNotSeen, healthNotes, lastFed } = req.body;
    
    const cat = db.prepare('SELECT * FROM cats WHERE id = ?').get(req.params.id);
    if (!cat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    if (name !== undefined && name.trim() !== cat.name.trim()) {
      const normalizedName = name.trim().toLowerCase();
      const existingCat = db.prepare('SELECT id, name FROM cats WHERE LOWER(TRIM(name)) = ? AND id != ?').get(normalizedName, req.params.id);
      
      if (existingCat) {
        return res.status(400).json({ error: `A cat named "${existingCat.name}" already exists. Please use a different name.` });
      }
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name.trim()); }
    if (markings !== undefined) { updates.push('markings = ?'); values.push(markings); }
    if (building !== undefined) { updates.push('building = ?'); values.push(building); }
    if (gender !== undefined) { updates.push('gender = ?'); values.push(gender); }
    if (spayNeuter !== undefined) { updates.push('spay_neuter = ?'); values.push(spayNeuter ? 1 : 0); }
    if (vaccinations !== undefined) { updates.push('vaccinations = ?'); values.push(vaccinations); }
    if (healthNotes !== undefined) { updates.push('health_notes = ?'); values.push(healthNotes); }
    if (lastFed !== undefined) { updates.push('last_fed = ?'); values.push(lastFed); }
    if (lastSeenBy !== undefined) { 
      updates.push('last_seen_by = ?'); 
      values.push(lastSeenBy);
      // Note: last_seen_date is only updated by feeding, not by profile edits
    }
    if (daysNotSeen !== undefined) { updates.push('days_not_seen = ?'); values.push(daysNotSeen); }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.params.id);

    db.prepare(`UPDATE cats SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    db.prepare('INSERT INTO activity_log (volunteer_id, cat_id, action) VALUES (?, ?, ?)').run(
      req.user.id,
      req.params.id,
      'updated_cat'
    );

    const updatedCat = db.prepare('SELECT * FROM cats WHERE id = ?').get(req.params.id);
    const photos = db.prepare('SELECT * FROM photos WHERE cat_id = ? ORDER BY date DESC').all(req.params.id);

    res.json({
      ...updatedCat,
      spayNeuter: Boolean(updatedCat.spay_neuter),
      photos
    });
  } catch (error) {
    console.error('Error updating cat:', error);
    res.status(500).json({ error: 'Failed to update cat' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const cat = db.prepare('SELECT * FROM cats WHERE id = ?').get(req.params.id);
    
    if (!cat) {
      return res.status(404).json({ error: 'Cat not found' });
    }

    console.log('Deleting cat:', cat.name, '(ID:', cat.id, ')');

    // Delete associated photos first
    const deletedPhotos = db.prepare('DELETE FROM photos WHERE cat_id = ?').run(req.params.id);
    console.log('Deleted', deletedPhotos.changes, 'photos for cat:', cat.id);

    // Delete activity logs
    const deletedLogs = db.prepare('DELETE FROM activity_log WHERE cat_id = ?').run(req.params.id);
    console.log('Deleted', deletedLogs.changes, 'activity logs for cat:', cat.id);

    // Delete the cat
    const result = db.prepare('DELETE FROM cats WHERE id = ?').run(req.params.id);
    console.log('Deleted cat, affected rows:', result.changes);

    res.json({ 
      message: `Cat "${cat.name}" has been deleted successfully`,
      deletedPhotos: deletedPhotos.changes,
      deletedLogs: deletedLogs.changes
    });
  } catch (error) {
    console.error('Error deleting cat:', error);
    res.status(500).json({ error: 'Failed to delete cat' });
  }
});


router.get('/:id/photos', (req, res) => {
  try {
    const photos = db.prepare('SELECT * FROM photos WHERE cat_id = ? ORDER BY date DESC').all(req.params.id);
    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

export default router;
