import express from 'express';
import cors from 'cors';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './config/database.js';
import { seedInitialData } from './models/seedData.js';
import apiRoutes from './routes/apiRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database initialization cached promise for serverless environments
let initPromise = null;
async function ensureDbReady() {
  if (!initPromise) {
    initPromise = (async () => {
      await initDatabase();
      await seedInitialData();
    })();
  }
  return initPromise;
}

// Middleware to ensure DB is initialized before API requests on serverless (Vercel)
app.use(async (req, res, next) => {
  try {
    await ensureDbReady();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(500).json({ success: false, error: 'Database service unavailable' });
  }
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// For local running
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  ensureDbReady().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server listening on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Failed to start server:', err);
  });
}

export default app;
