// CommonJS version of server for Jest testing
const express = require('express');
const cors = require('cors');
const path = require('path');
const { fileURLToPath } = require('url');

// Mock database for testing
const db = {
  prepare: () => ({
    run: () => ({}),
    all: () => [],
    get: () => null
  })
};

// Import routes
const photosRouter = require('./routes/photos.cjs');
const catsRouter = require('./routes/cats.cjs');
const authRouter = require('./routes/auth.cjs');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Make database available to routes (fallback if not set by test)
app.use((req, res, next) => {
  if (!req.db) {
    req.db = db;
  }
  next();
});

// Routes
app.use('/api/photos', photosRouter);
app.use('/api/cats', catsRouter);
app.use('/api/auth', authRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

module.exports = { app };
