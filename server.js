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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Mount API routes
app.use('/api', apiRoutes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Async initialization before listening
async function startServer() {
  try {
    await initDatabase();
    await seedInitialData();

    app.listen(PORT, '0.0.0.0', () => {
      const interfaces = os.networkInterfaces();
      const addresses = [];

      for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
          if (net.family === 'IPv4' && !net.internal) {
            addresses.push(net.address);
          }
        }
      }

      const lanIp = addresses[0] || '127.0.0.1';

      console.log('\n=============================================================');
      console.log('   🚀 Marketing Team Visit Tracker & Dashboard Running!');
      console.log('=============================================================');
      console.log(`  💻 PC / Localhost:     http://localhost:${PORT}`);
      console.log(`  📱 Mobile / Local LAN:  http://${lanIp}:${PORT}`);
      console.log('=============================================================\n');
    });
  } catch (err) {
    console.error('Failed to initialize server:', err);
    process.exit(1);
  }
}

startServer();
