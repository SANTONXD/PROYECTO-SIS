require('dotenv').config();
const db = require('./knex');

async function seedData() {
  try {
    // Verificar si ya hay vuelos
    const existingFlights = await db('flights').count('* as total');
    if (parseInt(existingFlights[0].total) > 0) {
      console.log('🟢 Los vuelos ya existen, no se insertarán duplicados.');
      process.exit(0);
    }

    // Insertar vuelos de ejemplo
    const flightsData = [
      {
        origin: 'Bogotá',
        destination: 'Medellín',
        departure: '2025-11-15 10:00:00',
        arrival: '2025-11-15 11:00:00',
        total_seats: 5
      },
      {
        origin: 'Cali',
        destination: 'Cartagena',
        departure: '2025-11-16 09:30:00',
        arrival: '2025-11-16 11:10:00',
        total_seats: 4
      },
