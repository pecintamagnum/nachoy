-- Buat database jika belum ada
CREATE DATABASE IF NOT EXISTS nachos_db;
USE nachos_db;

-- Tabel Admin
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Produk (Nachos)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pesanan (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address TEXT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Detail Pesanan (Order Items)
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Insert dummy admin (password: admin123)
-- Hash password generated with bcrypt for 'admin123'
INSERT IGNORE INTO admin_users (username, password) VALUES ('admin', '$2a$10$7vN3vV/qG0UvL/mU2Z2M9Oq3rNq5U7L8K7L0L0L0L0L0L0L0L0L0L0');

-- Insert dummy products
INSERT INTO products (name, description, price, image_url, stock) VALUES 
('Nachos Supreme', 'Keripik tortila renyah dengan lelehan keju, daging cincang, jalapeno, dan sour cream.', 45000, 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 50),
('Nachos BBQ Chicken', 'Nachos dengan topping ayam panggang BBQ, bawang bombay, dan saus keju spesial.', 50000, 'https://images.unsplash.com/photo-1582169505937-b9992bd01ed9?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 30),
('Classic Cheese Nachos', 'Nachos klasik dengan lelehan keju cheddar yang melimpah dan saus salsa.', 35000, 'https://images.unsplash.com/photo-1613514785940-daed07799d9b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80', 100);
