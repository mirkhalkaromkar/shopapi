require('dotenv').config();
const express = require('express');
const morgan  = require('morgan');

const productRoutes  = require('./src/routes/products');
const categoryRoutes = require('./src/routes/categories');
const { connectDB }  = require('./src/config/db');
const { connectCache } = require('./src/config/cache');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ─────────────────────────────────────────────
app.use(express.json());
app.use(morgan('combined'));

// ── Health check ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status : 'ok',
    service: 'shopapi',
    time   : new Date().toISOString(),
  });
});

// ── Routes ─────────────────────────────────────────────────
app.use('/products',   productRoutes);
app.use('/categories', categoryRoutes);

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────
async function start() {
  await connectDB();
  await connectCache();   // Redis — non-fatal if unavailable locally
  app.listen(PORT, () => {
    console.log(`[shopapi] Running on port ${PORT}`);
  });
}

start();
