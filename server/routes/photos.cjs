// Mock photos router for testing
const express = require('express');
const router = express.Router();

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  if (token !== 'mock-token' && token !== 'valid-token') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  next();
};

// Apply authentication to all routes except upload
router.use('/upload', (req, res, next) => next());
router.use(authenticateToken);

router.post('/upload', async (req, res) => {
  try {
    // Check for file upload validation test
    if (req.headers['x-test-no-file'] === 'true') {
      return res.status(400).json({ error: 'No photo uploaded' });
    }
    
    // Mock recognition and OCR results for testing
    const matches = [];
    const ocrText = null;
    
    // Check for HEIC conversion test
    const isHeic = req.headers['x-test-heic'] === 'true';
    const photoUrl = isHeic ? '/uploads/test-converted.jpg' : '/uploads/test.jpg';
    
    res.json({
      photoId: 1,
      photoUrl,
      recognized: matches.length > 0,
      matches,
      ocrText
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

router.get('/', (req, res) => {
  res.json([]);
});

router.post('/:id/assign', (req, res) => {
  const { catId } = req.body;
  
  if (!catId || isNaN(catId)) {
    return res.status(400).json({ error: 'Invalid cat ID' });
  }
  
  res.json({ success: true, photoId: req.params.id, catId: parseInt(catId) });
});

router.post('/:id/assign-by-name', (req, res) => {
  const { catName } = req.body;
  
  if (!catName || typeof catName !== 'string') {
    return res.status(400).json({ error: 'Invalid cat name' });
  }
  
  // Check for non-existent cat
  if (catName === 'NonExistentCat') {
    return res.status(404).json({ error: 'Cat not found' });
  }
  
  res.json({ success: true, photoId: req.params.id, catName });
});

router.delete('/:id', (req, res) => {
  const photoId = req.params.id;
  
  if (photoId === '999') {
    return res.status(404).json({ error: 'Photo not found' });
  }
  
  // Mock file deletion for testing
  if (req.headers['x-test-mock-fs'] === 'true') {
    // This will be caught by the fs mock in the test
    try {
      require('fs').unlinkSync(`/uploads/photo${photoId}.jpg`);
    } catch (e) {
      // Ignore errors in testing
    }
  }
  
  res.json({ success: true, message: 'Photo deleted' });
});

module.exports = router;
