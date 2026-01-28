// Mock auth router for testing
const express = require('express');
const router = express.Router();

// Mock user data
let users = [
  { id: 1, username: 'testuser', name: 'Test User', email: 'test@example.com', password_hash: 'hashed_password123' }
];

// Clear users for each test
const resetUsers = () => {
  users = [
    { id: 1, username: 'testuser', name: 'Test User', email: null, password_hash: 'hashed_password123' }
  ];
};

router.post('/register', (req, res) => {
  const { username, name, password, email } = req.body;
  
  // Validation
  if (!username || !name || !password) {
    return res.status(400).json({ error: 'Username, password, and name are required' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  
  // Check if username already exists
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  
  // Check if email already exists (if provided)
  if (email && users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Email already exists' });
  }
  
  const newUser = {
    id: users.length + 1,
    username,
    name,
    email: email || null,
    password_hash: 'hashed_' + password // Mock hash
  };
  
  users.push(newUser);
  
  res.status(201).json({ 
    token: 'mock-token', 
    user: { id: newUser.id, username: newUser.username, name: newUser.name, email: newUser.email }
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  // Find user
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  
  // Check password (mock)
  if (user.password_hash !== 'hashed_' + password) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }
  
  res.json({ 
    token: 'mock-token', 
    user: { id: user.id, username: user.username, name: user.name, email: user.email }
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
