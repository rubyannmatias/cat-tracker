import express from 'express';
import { db } from '../database/init.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/login', (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    let volunteer = db.prepare('SELECT * FROM volunteers WHERE email = ?').get(email);

    if (!volunteer) {
      const result = db.prepare('INSERT INTO volunteers (name, email) VALUES (?, ?)').run(name, email);
      volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(result.lastInsertRowid);
    } else {
      db.prepare('UPDATE volunteers SET name = ? WHERE email = ?').run(name, email);
      volunteer.name = name;
    }

    const token = generateToken(volunteer);

    res.json({
      user: {
        id: volunteer.id,
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
