const express = require('express');
const pool = require('./db');
const app = express();
const port = 3000;

// Para recibir datos en formato JSON desde React
app.use(express.json());

// Permitir que React (puerto 3001) hable con Node (puerto 3000)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST');
  next();
});

// Ruta original de prueba
app.get('/save', async (req, res) => {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, content TEXT)');
    await pool.query('INSERT INTO messages (content) VALUES ($1)', ['Hola desde PostgreSQL!']);
    res.send('Mensaje guardado en la base de datos');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error');
  }
});

// ← NUEVA RUTA: guardar usuario del formulario
app.post('/registro', async (req, res) => {
const { sexo, peso, altura, mes, dia, anio, actividad, dieta, pesoMeta, usuario, correo, tipoDieta, intolerancias, alimentosRestringidos } = req.body;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        sexo TEXT,
        peso NUMERIC,
        altura NUMERIC,
        fecha_nacimiento TEXT,
        actividad TEXT,
        dieta TEXT,
        peso_meta NUMERIC,
        usuario TEXT,
        correo TEXT,
        tipo_dieta TEXT,
        intolerancias TEXT,
        alimentos_restringidos TEXT
      )
    `);
    await pool.query(
  `INSERT INTO usuarios (sexo, peso, altura, fecha_nacimiento, actividad, dieta, peso_meta, usuario, correo, tipo_dieta, intolerancias, alimentos_restringidos)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
  [sexo, peso, altura, `${dia}/${mes}/${anio}`, actividad, dieta, pesoMeta, usuario, correo, tipoDieta, intolerancias.join(", "), alimentosRestringidos.join(", ")]
  );
    res.json({ mensaje: 'Usuario guardado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar');
  }
});

app.get('/', (req, res) => {
  res.send('¡Bienvenido! Usa /save para guardar un mensaje y /messages para verlos.');
});

app.listen(port, () => {
  console.log(`App corriendo en http://localhost:${port}`);
});