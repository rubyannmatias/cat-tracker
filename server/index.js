import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import catRoutes from './routes/cats.js';
import photoRoutes from './routes/photos.js';
import { initDatabase } from './database/init.js';
import { startDailyUpdate } from './utils/updateDaysNotSeen.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

initDatabase();
startDailyUpdate();

app.use('/api/auth', authRoutes);
app.use('/api/cats', catRoutes);
app.use('/api/photos', photoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🐱 Cat Tracker API running on http://localhost:${PORT}`);
});
