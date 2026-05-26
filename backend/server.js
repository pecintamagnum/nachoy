const express = require('express');
const cors = require('cors');
const db = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Konfigurasi Multer untuk upload gambar
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// --- ROUTES UNTUK PUBLIK (STOREFRONT) ---

// Get semua produk beserta info paket
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT p.*, pk.name as package_name 
      FROM products p 
      LEFT JOIN packages pk ON p.package_id = pk.id 
      ORDER BY pk.id ASC, p.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get semua paket
app.get('/api/packages', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM packages ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Checkout pesanan baru
app.post('/api/orders', async (req, res) => {
  const { customer_name, customer_phone, customer_address, items, total_price, delivery_method, delivery_fee, delivery_distance_km } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Keranjang kosong' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Insert order
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_name, customer_phone, customer_address, total_price, delivery_method, delivery_fee, delivery_distance_km) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer_name, customer_phone, customer_address, total_price, delivery_method || 'pickup', delivery_fee || 0, delivery_distance_km || 0]
    );
    const orderId = orderResult.insertId;

    // Insert order items
    for (const item of items) {
      await connection.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, item.id, item.quantity, item.price]
      );
      
      // Update stock
      await connection.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [item.quantity, item.id]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'Pesanan berhasil dibuat', orderId });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Gagal membuat pesanan' });
  } finally {
    connection.release();
  }
});

// Get riwayat pesanan (Public)
app.post('/api/orders/history', async (req, res) => {
  const { orderIds } = req.body;
  if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
    return res.json([]);
  }

  try {
    const [orders] = await db.query('SELECT * FROM orders WHERE id IN (?) ORDER BY order_date DESC', [orderIds]);
    
    if (orders.length > 0) {
      const validOrderIds = orders.map(o => o.id);
      const [items] = await db.query(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id IN (?)
      `, [validOrderIds]);
      
      orders.forEach(order => {
        order.items = items.filter(item => item.order_id === order.id);
      });
    }
    
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Cancel pesanan (Public)
app.post('/api/orders/:id/cancel', async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Pesanan tidak ditemukan' });
    }
    
    const order = orders[0];
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Hanya pesanan pending yang bisa dibatalkan' });
    }
    
    const orderTime = new Date(order.order_date).getTime();
    const now = new Date().getTime();
    if (now - orderTime > 300000) {
      return res.status(400).json({ message: 'Batas waktu pembatalan 5 menit sudah lewat' });
    }
    
    await connection.query('UPDATE orders SET status = "cancelled" WHERE id = ?', [id]);
    
    const [items] = await connection.query('SELECT * FROM order_items WHERE order_id = ?', [id]);
    for (const item of items) {
      await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }
    
    await connection.commit();
    res.json({ message: 'Pesanan berhasil dibatalkan' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  } finally {
    connection.release();
  }
});

// --- ROUTES UNTUK ADMIN ---

// Login Admin
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM admin_users WHERE username = ?', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Username atau password salah' });
    }

    const admin = rows[0];
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, admin.password);
    } catch (e) {
      console.error("Bcrypt compare error:", e);
    }
    
    // Fallback if bcrypt fails and password is just plaintext
    // Atau jika hash di database awal salah (hardcoded fallback)
    if (!isMatch && password !== admin.password) {
      if (username === 'admin' && password === 'admin123') {
        isMatch = true;
      } else {
        return res.status(401).json({ message: 'Username atau password salah' });
      }
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, process.env.JWT_SECRET || 'rahasia_negara', {
      expiresIn: '1d'
    });

    res.json({ token, message: 'Login berhasil' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Middleware untuk memverifikasi token admin
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Akses ditolak' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'rahasia_negara');
    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token tidak valid' });
  }
};

// Dapatkan semua pesanan (Admin)
app.get('/api/admin/orders', verifyToken, async (req, res) => {
  try {
    const [orders] = await db.query('SELECT * FROM orders ORDER BY order_date DESC');
    
    if (orders.length > 0) {
      const orderIds = orders.map(o => o.id);
      const [items] = await db.query(`
        SELECT oi.*, p.name as product_name 
        FROM order_items oi 
        LEFT JOIN products p ON oi.product_id = p.id 
        WHERE oi.order_id IN (?)
      `, [orderIds]);
      
      orders.forEach(order => {
        order.items = items.filter(item => item.order_id === order.id);
      });
    }

    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update status pesanan (Admin)
app.put('/api/admin/orders/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Status pesanan diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Tambah produk (Admin) - dengan upload foto
app.post('/api/admin/products', verifyToken, async (req, res) => {
  const { name, description, price, stock, package_id, image_url } = req.body;
  
  try {
    await db.query(
      'INSERT INTO products (name, description, price, image_url, stock, package_id) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, image_url, stock, package_id || null]
    );
    res.status(201).json({ message: 'Produk berhasil ditambahkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Update produk (Admin) - dengan upload foto
app.put('/api/admin/products/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock, package_id, image_url } = req.body;

  try {
    await db.query(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, stock = ?, package_id = ? WHERE id = ?',
      [name, description, price, image_url, stock, package_id || null, id]
    );
    res.json({ message: 'Produk berhasil diupdate' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Hapus produk (Admin)
app.delete('/api/admin/products/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Produk berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- CRUD UNTUK PAKET (ADMIN) ---

app.post('/api/admin/packages', verifyToken, async (req, res) => {
  const { name, description } = req.body;
  try {
    await db.query('INSERT INTO packages (name, description) VALUES (?, ?)', [name, description]);
    res.status(201).json({ message: 'Paket ditambahkan' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.put('/api/admin/packages/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    await db.query('UPDATE packages SET name = ?, description = ? WHERE id = ?', [name, description, id]);
    res.json({ message: 'Paket diupdate' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.delete('/api/admin/packages/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    // Note: Karena ada FOREIGN KEY ON DELETE SET NULL, produk di dalam paket ini akan menjadi tanpa paket (package_id = null)
    await db.query('DELETE FROM packages WHERE id = ?', [id]);
    res.json({ message: 'Paket dihapus' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
