-- ── Schema ────────────────────────────────────────────────

CREATE DATABASE IF NOT EXISTS shopdb;
USE shopdb;

CREATE TABLE IF NOT EXISTS categories (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,
  stock       INT DEFAULT 0,
  category_id INT NOT NULL,
  image_url   VARCHAR(500),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ── Seed data ──────────────────────────────────────────────

INSERT INTO categories (name, slug) VALUES
  ('Electronics', 'electronics'),
  ('Clothing',    'clothing'),
  ('Books',       'books'),
  ('Home & Kitchen', 'home-kitchen')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO products (name, description, price, stock, category_id, image_url) VALUES
  ('Wireless Headphones', 'Noise-cancelling over-ear headphones', 2999.00, 50, 1, NULL),
  ('USB-C Hub',           '7-in-1 hub with HDMI and SD card',     1499.00, 120, 1, NULL),
  ('Cotton T-Shirt',      'Unisex plain cotton t-shirt',            499.00, 200, 2, NULL),
  ('Running Shoes',       'Lightweight mesh running shoes',        3499.00, 80, 2, NULL),
  ('The DevOps Handbooks', 'Gene Kim — DevOps practices',           799.00, 30, 3, NULL),
  ('Clean Code',          'Robert C. Martin — coding principles',  699.00, 25, 3, NULL),
  ('Coffee Maker',        '12-cup programmable coffee maker',     2199.00, 15, 4, NULL),
  ('Knife Set',           '6-piece stainless steel kitchen knives',1299.00, 40, 4, NULL);
