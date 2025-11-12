const express = require('express');
const router = express.Router();
const db = require('../db/knex');
const uuid = require('crypto').randomBytes;

router.post('/', async (req, res) => {
  const { flight_id, seat_number } = req.body;
  const userId = req.user.userId;

  const trx = await db.transaction();
  try {
    // 1. buscar asiento (for update)
    const seat = await trx('seats')
      .where({ flight_id, seat_number })
      .forUpdate()
      .first();

    if (!seat) {
      await trx.rollback();
      return res.status(404).json({ error: 'Asiento no encontrado' });
    }
    if (seat.status !== 'available') {
      await trx.rollback();
      return res.status(409).json({ error: 'Asiento no disponible' });
    }

    // 2. marcar como reserved
    await trx('seats').where({ id: seat.id }).update({ status: 'reserved' });

    // 3. crear reserva
    const code = 'RES-' + Date.now() + '-' + Math.floor(Math.random()*10000);
    const [resId] = await trx('reservations').insert({
      user_id: userId,
      flight_id,
      seat_id: seat.id,
      code,
      status: 'confirmed'
    });

    await trx.commit();
    return res.status(201).json({ reservationId: resId, code });
  } catch (err) {
    await trx.rollback();
    console.error(err);
    return res.status(500).json({ error: 'Error en la reserva' });
  }
});

module.exports = router;

// --- ya debe estar arriba ---
// const express = require('express');
// const router = express.Router();
// const db = require('../db/knex');

router.get('/my-reservations', async (req, res) => {
  const userId = req.user.userId; // viene del middleware JWT
  try {
    const reservations = await db('reservations as r')
      .join('flights as f', 'r.flight_id', 'f.id')
      .join('seats as s', 'r.seat_id', 's.id')
      .select(
        'r.id as reservation_id',
        'r.code',
        'r.status',
        'r.created_at',
        'f.origin',
        'f.destination',
        'f.departure',
        's.seat_number'
      )
      .where('r.user_id', userId)
      .orderBy('r.created_at', 'desc');

    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener las reservas' });
  }
});

module.exports = router;
