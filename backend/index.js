import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initDB } from './config/database.js';
import { PORT, ADMIN_CHAT_ID } from './config/env.js';
import { initBot } from './services/botService.js';

import authRoutes from './routes/authRoutes.js';
import bookRoutes from './routes/bookRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import supportRoutes from './routes/supportRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/support', supportRoutes);

// Serve frontend in production
const distPath = join(__dirname, '../dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(join(distPath, 'index.html'));
});

initDB().then(() => {
  initBot();
  app.listen(PORT, () => {
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  📚 КНИЖНЫЙ МИР — Advanced Backend');
    console.log('═══════════════════════════════════════════');
    console.log(`  🌐 API:  http://localhost:${PORT}/api`);
    console.log(`  🤖 Bot:  Initialized (polling)`);
    console.log(`  👨‍💼 Admin: ${ADMIN_CHAT_ID}`);
    console.log('═══════════════════════════════════════════');
    console.log('');
  });
}).catch(console.error);

