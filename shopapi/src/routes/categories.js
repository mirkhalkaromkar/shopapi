const express = require('express');
const router  = express.Router();

const { getPool } = require('../config/db');
const cache       = require('../config/cache');

const CACHE_TTL = 600; // 10 min — categories rarely change

// ── GET /categories ────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'categories:all';

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }

    const [rows] = await getPool().query(
      'SELECT id, name, slug FROM categories ORDER BY name'
    );

    await cache.set(cacheKey, rows, CACHE_TTL);
    res.json({ source: 'db', data: rows });
  } catch (err) {
    next(err);
  }
});

// ── GET /categories/:id/products ──────────────────────────
router.get('/:id/products', async (req, res, next) => {
  try {
    const { id }   = req.params;
    const cacheKey = `categories:${id}:products`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }

    const [rows] = await getPool().query(`
      SELECT p.id, p.name, p.price, p.stock, p.image_url
      FROM   products p
      WHERE  p.category_id = ?
      ORDER  BY p.name
    `, [id]);

    await cache.set(cacheKey, rows, CACHE_TTL);
    res.json({ source: 'db', data: rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
