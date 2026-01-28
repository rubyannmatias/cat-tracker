import jwt from 'jsonwebtoken';
import { db } from '../database/init.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    // Check if user still exists in database (handles database reset scenario)
    const existingUser = db.prepare('SELECT id, username, name FROM volunteers WHERE id = ?').get(user.id);
    if (!existingUser) {
      return res.status(401).json({ 
        error: 'User account not found. Please log in again.',
        code: 'USER_NOT_FOUND'
      });
    }
    
    req.user = existingUser;
    next();
  });
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}
