const express = require('express');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const db = require('../db/knex');

const router = express.Router();



router.post('/register', async (req, res) => {

  const { name, email, password } = req.body;

  const hashed = await bcrypt.hash(password, 10);

  try {

    const [id] = await db('users').insert({ name, email, password: hashed });

    res.status(201).json({ id, email });

  } catch (err) {

    res.status(400).json({ error: 'Email ya registrado' });

  }

});



router.post('/login', async (req, res) => {

  const { email, password } = req.body;

  const user = await db('users').where({ email }).first();

  if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });

  const ok = await bcrypt.compare(password, user.password);

  if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });

  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.json({ token });

});



module.exports = router;
