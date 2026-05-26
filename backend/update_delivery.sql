USE nachos_db;

ALTER TABLE orders 
ADD COLUMN delivery_method ENUM('pickup', 'delivery') DEFAULT 'pickup',
ADD COLUMN delivery_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN delivery_distance_km DECIMAL(10, 2) DEFAULT 0;
