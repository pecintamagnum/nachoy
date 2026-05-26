USE nachos_db;

-- 1. Buat tabel packages
CREATE TABLE IF NOT EXISTS packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Masukkan paket default
INSERT INTO packages (name, description) VALUES 
('Paket Hemat', 'Cocok untuk akhir bulan dengan porsi pas di kantong!'),
('Paket Standar', 'Porsi standar untuk menemani waktu santai Anda.'),
('Paket Premium', 'Porsi besar dengan topping melimpah ruah, super mewah!');

-- 3. Tambahkan kolom package_id ke tabel products
-- Jika kolom sudah ada, baris ini mungkin error, tapi tidak apa-apa jika belum
ALTER TABLE products ADD COLUMN package_id INT;

-- 4. Set produk yang sudah ada menjadi Paket Standar (ID 2)
UPDATE products SET package_id = 2 WHERE package_id IS NULL;

-- 5. Tambahkan Foreign Key constraint ke produk
ALTER TABLE products
ADD CONSTRAINT fk_product_package
FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL;
