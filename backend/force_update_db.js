const db = require('./db');

async function run() {
  try {
    await db.query(`
      ALTER TABLE orders 
      ADD COLUMN delivery_method ENUM('pickup', 'delivery') DEFAULT 'pickup',
      ADD COLUMN delivery_fee DECIMAL(10, 2) DEFAULT 0,
      ADD COLUMN delivery_distance_km DECIMAL(10, 2) DEFAULT 0
    `);
    console.log("SUCCESS: Database schema updated!");
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log("SUCCESS: Columns already exist. No need to update.");
    } else {
      console.error("ERROR:", err.message);
    }
  } finally {
    process.exit(0);
  }
}

run();
