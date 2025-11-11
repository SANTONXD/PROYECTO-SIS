const express = require('express');
require('dotenv').config();
const authRoutes = require('./routes/auth');
const flightRoutes = require('./routes/flights');
const reservationRoutes = require('./routes/reservations');
const authMiddleware = require('./middleware/auth');

const app = express();
app.use(express.json());

// CORS simple (permite todos los orígenes; en producción restringir)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // o 'http://localhost:5500' si sirves en ese puerto
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});


app.use('/auth', authRoutes);
app.use('/flights', flightRoutes);
app.use('/reservations', authMiddleware, reservationRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log('Server on', port));
