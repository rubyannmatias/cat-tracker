import express from 'express';
import bcrypt from 'bcrypt';
import { db } from '../database/init.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const volunteer = db.prepare('SELECT * FROM volunteers WHERE username = ?').get(username);

    if (!volunteer) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, volunteer.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(volunteer);

    res.json({
      user: {
        id: volunteer.id,
        username: volunteer.username,
        name: volunteer.name,
        email: volunteer.email
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, password, name, email } = req.body;
    console.log('Registration request received:', { username, name, email: email || 'none' });

    if (!username || !password || !name) {
      console.log('Validation failed - missing fields');
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }

    // Check if username already exists
    console.log('Checking for existing username:', username);
    const existingUser = db.prepare('SELECT id FROM volunteers WHERE username = ?').get(username);
    if (existingUser) {
      console.log('Username already exists:', username);
      return res.status(409).json({ error: 'Username already exists' });
    }

    // Check if email already exists (if provided)
    if (email) {
      console.log('Checking for existing email:', email);
      const existingEmail = db.prepare('SELECT id FROM volunteers WHERE email = ?').get(email);
      if (existingEmail) {
        console.log('Email already exists:', email);
        return res.status(409).json({ error: 'Email already exists' });
      }
    }

    console.log('Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    console.log('Inserting new volunteer into database...');
    const result = db.prepare(`
      INSERT INTO volunteers (username, password_hash, name, email) 
      VALUES (?, ?, ?, ?)
    `).run(username, passwordHash, name, email || null);
    
    console.log('Database insert successful, ID:', result.lastInsertRowid);
    const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(result.lastInsertRowid);
    console.log('Retrieved volunteer:', { id: volunteer.id, username: volunteer.username });
    
    const token = generateToken(volunteer);
    console.log('Token generated successfully');

    res.status(201).json({
      user: {
        id: volunteer.id,
        username: volunteer.username,
        name: volunteer.name,
        email: volunteer.email
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
});

router.post('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(userId);

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, volunteer.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE volunteers SET password_hash = ? WHERE id = ?').run(newPasswordHash, userId);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.get('/volunteers', (req, res) => {
  try {
    const volunteers = db.prepare('SELECT id, name, email FROM volunteers ORDER BY name').all();
    res.json(volunteers);
  } catch (error) {
    console.error('Error fetching volunteers:', error);
    res.status(500).json({ error: 'Failed to fetch volunteers' });
  }
});

export default router;
