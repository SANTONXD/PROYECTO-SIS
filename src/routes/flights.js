const express = require('express');
const db = require('../db/knex');
const router = express.Router();

router.get('/', async (req, res) => {
  const { origin, destination, date } = req.query;
  let q = db('flights').select('*');
  if (origin) q.where('origin', origin);
  if (destination) q.where('destination', destination);
  if (date) q.whereRaw('DATE(departure) = ?', [date]);
  const flights = await q;
  res.json(flights);
});

module.exports = router;

// dentro de src/routes/flights.js
// añadir al final del archivo (después del router.get('/'...))
router.get('/:id/seats', async (req, res) => {
  const flightId = req.params.id;
  try {
    const seats = await db('seats').where({ flight_id: flightId }).select('id','flight_id','seat_number','status');
    res.json(seats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asientos' });
  }
});
