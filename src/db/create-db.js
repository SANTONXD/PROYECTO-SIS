require('dotenv').config();
const db = require('./knex');

async function createTables() {
  try {
    await db.raw(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150),
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS flights (
        id SERIAL PRIMARY KEY,
        origin VARCHAR(100),
        destination VARCHAR(100),
        departure TIMESTAMP,
        arrival TIMESTAMP,
        total_seats INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS seats (
        id SERIAL PRIMARY KEY,
        flight_id INT REFERENCES flights(id),
        seat_number VARCHAR(10) NOT NULL,
        status VARCHAR(15) DEFAULT 'available',
        UNIQUE (flight_id, seat_number)
      );

      CREATE TABLE IF NOT EXISTS reservations (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id),
        flight_id INT REFERENCES flights(id),
        seat_id INT REFERENCES seats(id),
        code VARCHAR(50) UNIQUE NOT NULL,
        status VARCHAR(20) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tablas creadas correctamente');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creando tablas:', err);
    process.exit(1);
  }
}

createTables();
