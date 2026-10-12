CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(32) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  brand VARCHAR(100) NOT NULL DEFAULT 'Tanpa merek',
  category VARCHAR(60) NOT NULL,
  price DECIMAL(15, 2) UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 0,
  unit VARCHAR(20) NOT NULL DEFAULT 'pcs',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_products_category (category),
  INDEX idx_products_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(100) NOT NULL DEFAULT 'Tanpa merek' AFTER name;
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS product_brand VARCHAR(100) NOT NULL DEFAULT 'Tanpa merek' AFTER product_name;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(60) NOT NULL,
  role ENUM('admin', 'gudang', 'kasir') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO users (name, email, password_hash, role) VALUES
  ('Admin stokQu', 'admin@stokqu.id', '$2b$12$OWRfGjmFIqgZpI74qjt96./xTlCWvYF7igneYQQ1QT2rN.wwQ8fUq', 'admin'),
  ('Petugas Gudang', 'gudang@stokqu.id', '$2b$12$3k2EjwL3/kEgqyVRiZ4CuOy9sQ0/cNA/7.uTP6C0R07fvX/xzfi5G', 'gudang'),
  ('Kasir stokQu', 'kasir@stokqu.id', '$2b$12$gjLkMe4kJRj6tuqX8kuO4.I/XiIS7fkQtjdE3gurLVRcS/QGa0lxK', 'kasir');

CREATE TABLE IF NOT EXISTS sales (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  receipt_number VARCHAR(32) NOT NULL UNIQUE,
  cashier_id BIGINT UNSIGNED NOT NULL,
  cashier_name VARCHAR(100) NOT NULL,
  cashier_email VARCHAR(254) NOT NULL,
  payment_method ENUM('tunai', 'transfer', 'qris') NOT NULL,
  subtotal DECIMAL(15, 2) UNSIGNED NOT NULL,
  amount_paid DECIMAL(15, 2) UNSIGNED NOT NULL,
  change_due DECIMAL(15, 2) UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sales_cashier_date (cashier_id, created_at),
  INDEX idx_sales_created_at (created_at),
  CONSTRAINT fk_sales_cashier FOREIGN KEY (cashier_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sale_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  sale_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(32) NOT NULL,
  product_name VARCHAR(120) NOT NULL,
  product_brand VARCHAR(100) NOT NULL DEFAULT 'Tanpa merek',
  unit VARCHAR(20) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  unit_price DECIMAL(15, 2) UNSIGNED NOT NULL,
  line_total DECIMAL(15, 2) UNSIGNED NOT NULL,
  INDEX idx_sale_items_sale_id (sale_id),
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO products (id, name, brand, category, price, quantity, unit) VALUES
  ('sembako-001', 'Beras Setra Ramos 5 kg', 'Sania', 'Beras & Karbohidrat', 72000, 35, 'karung'),
  ('sembako-002', 'Minyak Goreng 2 liter', 'Bimoli', 'Minyak & Bumbu', 36500, 28, 'pouch'),
  ('sembako-003', 'Gula Pasir 1 kg', 'Gulaku', 'Gula & Tepung', 17500, 16, 'pack'),
  ('sembako-004', 'Tepung Terigu Serbaguna 1 kg', 'Segitiga Biru', 'Gula & Tepung', 13000, 9, 'pack'),
  ('sembako-005', 'Telur Ayam Negeri 1 kg', 'Telur Ayam Segar', 'Protein', 29500, 7, 'kg'),
  ('sembako-006', 'Mi Instan Goreng', 'Indomie', 'Makanan Instan', 3500, 120, 'pcs'),
  ('sembako-007', 'Garam Dapur Beryodium 500 g', 'Refina', 'Minyak & Bumbu', 4500, 38, 'pack'),
  ('sembako-008', 'Kecap Manis 600 ml', 'ABC', 'Minyak & Bumbu', 21500, 14, 'botol');

UPDATE products SET brand = CASE id
  WHEN 'sembako-001' THEN 'Sania'
  WHEN 'sembako-002' THEN 'Bimoli'
  WHEN 'sembako-003' THEN 'Gulaku'
  WHEN 'sembako-004' THEN 'Segitiga Biru'
  WHEN 'sembako-005' THEN 'Telur Ayam Segar'
  WHEN 'sembako-006' THEN 'Indomie'
  WHEN 'sembako-007' THEN 'Refina'
  WHEN 'sembako-008' THEN 'ABC'
  WHEN 'stk-e8af83f0ac8c4673b23c' THEN 'Indomie'
  ELSE brand
END
WHERE id IN ('sembako-001', 'sembako-002', 'sembako-003', 'sembako-004', 'sembako-005', 'sembako-006', 'sembako-007', 'sembako-008', 'stk-e8af83f0ac8c4673b23c');
