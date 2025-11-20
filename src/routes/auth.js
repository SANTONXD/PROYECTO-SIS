const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/knex');
const router = express.Router();

router.post('/register', async (req, res) => {
  // ... (código de validaciones omitido) ...

  // Si pasa todo lo anterior, procedemos a hashear y guardar
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [id] = await db('users').insert({ name, email, password: hashed });
    // Es buena práctica usar 'return' en la respuesta de éxito también.
    return res.status(201).json({ id, email }); 
  } catch (err) {
    console.error('Error de registro (posiblemente DB):', err); // Mensaje más específico
    
    // Detectar error de duplicado y DEVOLVER
    if (err.code === 'ER_DUP_ENTRY' || err.code === '23505' || err.errno === 1062) {
        return res.status(400).json({ error: 'Email ya registrado' });
    }
    
    // Captura cualquier otro error (incluyendo fallos de conexión a DB) y DEVOLVER
    // Usamos 500 para indicar que el error no es culpa del usuario, sino del servidor.
    return res.status(500).json({ error: 'Error interno del servidor o de base de datos.' }); 
  }
});

router.post('/login', async (req, res) => {
  // ... (el código de login no necesita cambios) ...
  const { email, password } = req.body;
  const user = await db('users').where({ email }).first();
  if (!user) return res.status(401).json({ error: 'Credenciales invalidas' });
  
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Credenciales invalidas' });
  
  const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token }); // Agregué 'return' aquí por consistencia.
});

module.exports = router;

module.exports = router;

