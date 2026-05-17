const Redis = require('ioredis');

let client = null;

async function connectCache() {
  try {
    client = new Redis({
      host              : process.env.REDIS_HOST || 'localhost',
      port              : process.env.REDIS_PORT || 6379,
      password          : process.env.REDIS_PASSWORD || undefined,
      lazyConnect       : true,
      retryStrategy     : () => null,   // don't retry — fail fast locally
      enableOfflineQueue: false,
    });

    await client.connect();
    console.log('[cache] Connected to Redis');
  } catch (err) {
    console.warn('[cache] Redis unavailable — running without cache:', err.message);
    client = null;
  }
}

// ── Helpers ────────────────────────────────────────────────

async function get(key) {
  if (!client) return null;
  try {
    const val = await client.get(key);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
}

async function set(key, value, ttlSeconds = 300) {
  if (!client) return;
  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch {
    // non-fatal
  }
}

async function del(...keys) {
  if (!client) return;
  try {
    await client.del(...keys);
  } catch {
    // non-fatal
  }
}

module.exports = { connectCache, get, set, del };
