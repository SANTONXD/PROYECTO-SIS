const express = require('express');
const router = express.Router();
const db = require('../db/knex');

// Crear reserva
router.post('/', async (req, res) => {
  const { flight_id, seat_number } = req.body;
  const userId = req.user.userId;

  const trx = await db.transaction();
  try {
    // 1. Buscar asiento con bloqueo
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

    // 2. Marcar como reservado
    await trx('seats')
      .where({ id: seat.id })
      .update({ status: 'reserved' });

    // 3. Crear reserva
    const code = 'RES-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

    const reservation = await trx('reservations')
      .insert({
        user_id: userId,
        flight_id,
        seat_id: seat.id,
        code,
        status: 'confirmed'
      })
      .returning('id'); // NECESARIO EN POSTGRESQL

    const resId = reservation[0].id;

    await trx.commit();

    return res.status(201).json({ reservationId: resId, code });

  } catch (err) {
    await trx.rollback();
    console.error(err);
    return res.status(500).json({ error: 'Error en la reserva' });
  }
});

// Obtener mis reservas
router.get('/my-reservations', async (req, res) => {
  const userId = req.user.userId;

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

    return res.json(reservations);

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error al obtener las reservas' });
  }
});

// Procesar pago de una reserva
router.post('/:id/pay', async (req, res) => {
  // Logs para depurar token / usuario
  console.log('--- /:id/pay request ---');
  console.log('Authorization header:', req.headers.authorization);
  console.log('Cookie header:', req.headers.cookie);
  console.log('req.user (before auth check):', req.user);

  // Verificar que el middleware de auth haya puesto req.user
  if (!req.user || !req.user.userId) {
    console.warn('No token / usuario no autenticado');
    return res.status(401).json({ error: 'No token' });
  }

  const userId = req.user.userId;
  const reservationId = Number(req.params.id);

  const trx = await db.transaction();
  try {
    // Bloquear la reserva para evitar race conditions
    const reservation = await trx('reservations')
      .where({ id: reservationId, user_id: userId })
      .forUpdate()
      .first();

    if (!reservation) {
      await trx.rollback();
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }

    if (reservation.status === 'paid') {
      await trx.rollback();
      return res.status(409).json({ error: 'Reserva ya pagada' });
    }

    // Bloquear el asiento asociado
    const seat = await trx('seats')
      .where({ id: reservation.seat_id })
      .forUpdate()
      .first();

    if (!seat) {
      await trx.rollback();
      return res.status(404).json({ error: 'Asiento de la reserva no encontrado' });
    }

    if (seat.status === 'sold') {
      await trx.rollback();
      return res.status(409).json({ error: 'Asiento ya vendido' });
    }

    // Marcar reserva como pagada y asiento como vendido
    await trx('reservations').where({ id: reservationId }).update({ status: 'confirmed' });
    await trx('seats').where({ id: reservation.seat_id }).update({ status: 'sold' });

    await trx.commit();

    return res.json({ success: true, message: 'Pago procesado correctamente' });
  } catch (err) {
    try { await trx.rollback(); } catch (rbErr) { console.error('Rollback error:', rbErr); }
    console.error('Error procesando pago:', err);
    return res.status(500).json({ error: 'Error procesando el pago' });
  }
});

module.exports = router;
