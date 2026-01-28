// Mock cats router for testing
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

router.get('/', (req, res) => {
  try {
    // Check for test error simulation
    if (req.query.test_error === 'true') {
      throw new Error('Database error');
    }
    
    // Return mock data for testing
    res.json([
      { id: 1, name: 'Whiskers', markings: 'Orange tabby', building: 'A' },
      { id: 2, name: 'Mittens', markings: 'Black cat', building: 'B' }
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    // Check for non-existent cat
    if (req.params.id === '999') {
      return res.status(404).json({ error: 'Cat not found' });
    }
    
    // Return mock data for testing
    res.json({ id: 1, name: 'Whiskers', markings: 'Orange tabby' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.get('/:id/photos', (req, res) => {
  try {
    // Check for non-existent cat
    if (req.params.id === '999') {
      return res.status(404).json({ error: 'Cat not found' });
    }
    
    // Check for empty photos test
    if (req.query.empty === 'true') {
      return res.json([]);
    }
    
    // Return mock data for testing
    res.json([
      { id: 1, upload_date: '2023-01-01', url: '/uploads/photo1.jpg' },
      { id: 2, upload_date: '2023-01-02', url: '/uploads/photo2.jpg' }
    ]);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Apply authentication to POST, PUT, DELETE routes
router.post('/', authenticateToken);
router.put('/:id', authenticateToken);
router.delete('/:id', authenticateToken);

router.post('/', (req, res) => {
  const { name, markings } = req.body;
  
  // Validation
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  // Mock database error simulation
  if (name === 'Test') {
    return res.status(500).json({ error: 'Database error' });
  }
  
  res.status(201).json({ id: 3, name, success: true });
});

router.put('/:id', (req, res) => {
  const catId = req.params.id;
  if (catId === '999') {
    return res.status(404).json({ error: 'Cat not found' });
  }
  res.json({ id: 1, name: 'Updated Cat', success: true });
});

router.delete('/:id', (req, res) => {
  const catId = req.params.id;
  if (catId === '999') {
    return res.status(404).json({ error: 'Cat not found' });
  }
  res.json({ success: true, message: 'Cat deleted' });
});

module.exports = router;
