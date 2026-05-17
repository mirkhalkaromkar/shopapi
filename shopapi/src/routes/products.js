const express = require('express');
const router  = express.Router();

const { getPool }  = require('../config/db');
const cache        = require('../config/cache');
const { publish }  = require('../config/queue');

const CACHE_TTL = {
  list   : 300,   // 5 min  — product list changes often
  single : 600,   // 10 min — individual product less often
};

// ── GET /products ──────────────────────────────────────────
// Cache-aside: check Redis → hit = return early, miss = query DB + cache result
router.get('/', async (req, res, next) => {
  try {
    const cacheKey = 'products:all';

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }

    const [rows] = await getPool().query(`
      SELECT p.id, p.name, p.description, p.price,
             p.stock, p.image_url, c.name AS category
      FROM   products p
      JOIN   categories c ON c.id = p.category_id
      ORDER  BY p.created_at DESC
    `);

    await cache.set(cacheKey, rows, CACHE_TTL.list);
    res.json({ source: 'db', data: rows });
  } catch (err) {
    next(err);
  }
});

// ── GET /products/:id ──────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const { id }   = req.params;
    const cacheKey = `products:${id}`;

    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json({ source: 'cache', data: cached });
    }

    const [rows] = await getPool().query(`
      SELECT p.id, p.name, p.description, p.price,
             p.stock, p.image_url, c.name AS category
      FROM   products p
      JOIN   categories c ON c.id = p.category_id
      WHERE  p.id = ?
    `, [id]);

    if (!rows.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await cache.set(cacheKey, rows[0], CACHE_TTL.single);
    res.json({ source: 'db', data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// ── POST /products ─────────────────────────────────────────
// Write to DB → invalidate list cache → publish event to SQS
router.post('/', async (req, res, next) => {
  try {
    const { name, description, price, stock, category_id, image_url } = req.body;

    if (!name || !price || !category_id) {
      return res.status(400).json({ error: 'name, price, category_id are required' });
    }

    const [result] = await getPool().query(`
      INSERT INTO products (name, description, price, stock, category_id, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [name, description, price, stock || 0, category_id, image_url || null]);

    const newId = result.insertId;

    // invalidate stale list cache
    await cache.del('products:all');

    // async event — processed by worker.js
    await publish('PRODUCT_CREATED', { id: newId, name, price, category_id });

    res.status(201).json({ message: 'Product created', id: newId });
  } catch (err) {
    next(err);
  }
});

// ── PUT /products/:id ──────────────────────────────────────
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, price, stock, image_url } = req.body;

    const [result] = await getPool().query(`
      UPDATE products
      SET    name = COALESCE(?, name),
             description = COALESCE(?, description),
             price = COALESCE(?, price),
             stock = COALESCE(?, stock),
             image_url = COALESCE(?, image_url)
      WHERE  id = ?
    `, [name, description, price, stock, image_url, id]);

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // invalidate both list and individual caches
    await cache.del('products:all', `products:${id}`);

    await publish('PRODUCT_UPDATED', { id: Number(id) });

    res.json({ message: 'Product updated' });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /products/:id ───────────────────────────────────
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    const [result] = await getPool().query(
      'DELETE FROM products WHERE id = ?', [id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await cache.del('products:all', `products:${id}`);
    await publish('PRODUCT_DELETED', { id: Number(id) });

    res.json({ message: 'Product deleted' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
