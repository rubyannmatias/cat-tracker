import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import catRoutes from './routes/cats.js';
import photoRoutes from './routes/photos.js';
import { initDatabase, resetDatabase, migrateDatabase } from './database/init.js';
import { startDailyUpdate } from './utils/updateDaysNotSeen.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../dist')));

resetDatabase(); // Optional reset based on RESET_DB env var
migrateDatabase(); // Optional migration based on MIGRATE_DB env var
initDatabase();
startDailyUpdate();

app.use('/api/auth', authRoutes);
app.use('/api/cats', catRoutes);
app.use('/api/photos', photoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Manual trigger for testing daily update
app.get('/api/update-days-not-seen', (req, res) => {
  const { updateDaysNotSeen } = require('./utils/updateDaysNotSeen.js');
  updateDaysNotSeen();
  res.json({ message: 'Days not seen updated manually', timestamp: new Date().toISOString() });
});

// Serve frontend for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🐱 Cat Tracker API running on port ${PORT}`);
});
