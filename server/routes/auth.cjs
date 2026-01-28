// Mock auth router for testing
const express = require('express');
const router = express.Router();

// Mock user data
let users = [
  { id: 1, username: 'testuser', email: 'test@example.com', password: 'password123' }
];

// Clear users for each test
const resetUsers = () => {
  users = [
    { id: 1, username: 'testuser', email: 'test@example.com', password: 'password123' }
  ];
};

router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  
  // Validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Check if user already exists
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: 'Email already exists' });
  }
  
  const newUser = {
    id: users.length + 1,
    username: name.toLowerCase().replace(/\s+/g, ''),
    email,
    name
  };
  
  users.push(newUser);
  
  res.status(201).json({ 
    token: 'mock-token', 
    user: newUser 
  });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }
  
  if (!email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email format' });
  }
  
  // Find user
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Check password (mock)
  if (password !== 'password123') {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  res.json({ 
    token: 'mock-token', 
    user: { id: user.id, username: user.username, email: user.email, name: 'Test User' }
  });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  if (token !== 'mock-token' && token !== 'valid-token') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  const user = users[0]; // Mock authenticated user
  res.json({ id: user.id, username: user.username, email: user.email, name: 'Test User' });
});

router.get('/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.substring(7);
  if (token !== 'mock-token' && token !== 'valid-token') {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  const user = users[0]; // Mock authenticated user
  res.json({ id: user.id, username: user.username, email: user.email, name: 'Test User' });
});

// Add reset endpoint for testing
router.post('/reset', (req, res) => {
  resetUsers();
  res.json({ message: 'Users reset' });
});

module.exports = router;
