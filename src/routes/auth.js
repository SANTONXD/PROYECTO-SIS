const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/knex');
const router = express.Router();

router.post('/register', async (req, res) => {
  // 1. Recibimos también confirmPassword
  const { name, email, password, confirmPassword } = req.body;

  // --- INICIO VALIDACIONES ---

  // Validar campos vacíos
  if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // Validar coincidencia de contraseñas
  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Las contraseñas no coinciden' });
  }

  // Validar longitud mínima (8 caracteres)
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  // Validar complejidad (Mayúscula, Minúscula, Número)
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/;
  if (!strongPasswordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'La contraseña debe tener una mayúscula, una minúscula y un número' 
    });
  }

  // --- FIN VALIDACIONES ---

  // Si pasa todo lo anterior, procedemos a hashear y guardar
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [id] = await db('users').insert({ name, email, password: hashed });
    res.status(201).json({ id, email });
  } catch (err) {
    console.error(err); // Importante para ver errores reales en consola
    // Detectar error de duplicado (Postgres/MySQL suelen usar códigos similares o mensaje)
    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505' || err.errno === 1062) {
        return res.status(400).json({ error: 'Email ya registrado' });
    }
    res.status(400).json({ error: 'Error al registrar usuario' });
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
