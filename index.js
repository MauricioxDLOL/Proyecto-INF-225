const express = require('express');
const pool = require('./db');
const app = express();
const port = 3000;

app.use(express.json());

const inicializarDB = async () => {
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
        usuario TEXT UNIQUE,
        correo TEXT UNIQUE,
        tipo_dieta TEXT,
        intolerancias TEXT,
        alimentos_restringidos TEXT,
        contrasena TEXT
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS historial_alimentos (
        id SERIAL PRIMARY KEY,
        usuario TEXT,
        alimento TEXT,
        seguro BOOLEAN,
        mensaje TEXT,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);


    await pool.query(`
      CREATE TABLE IF NOT EXISTS actividad_fisica (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id),
        tipo_actividad VARCHAR(255),
        intensidad VARCHAR(50),
        duracion_minutos INTEGER,
        calorias_quemadas NUMERIC(5, 2)
      )
    `);

    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_dieta TEXT`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intolerancias TEXT`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS alimentos_restringidos TEXT`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contrasena TEXT`);

    console.log('Tablas inicializadas correctamente');
  } catch (err) {
    console.error('Error inicializando tablas:', err);
  }
};

inicializarDB();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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

// Registro
app.post('/registro', async (req, res) => {
  const { sexo, peso, altura, mes, dia, anio, actividad, dieta, pesoMeta, usuario, correo, tipoDieta, intolerancias, alimentosRestringidos, contrasena } = req.body;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        sexo TEXT, peso NUMERIC, altura NUMERIC,
        fecha_nacimiento TEXT, actividad TEXT, dieta TEXT,
        peso_meta NUMERIC, usuario TEXT, correo TEXT,
        tipo_dieta TEXT, intolerancias TEXT,
        alimentos_restringidos TEXT, contrasena TEXT
      )
    `);

    const existente = await pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 OR usuario = $2',
      [correo, usuario]
    );

    if (existente.rows.length > 0) {
      const campo = existente.rows[0].correo === correo ? 'correo' : 'usuario';
      return res.status(400).json({ error: `El ${campo} ya está registrado` });
    }

    await pool.query(
      `INSERT INTO usuarios (sexo, peso, altura, fecha_nacimiento, actividad, dieta, peso_meta, usuario, correo, tipo_dieta, intolerancias, alimentos_restringidos, contrasena)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [sexo, peso, altura, `${dia}/${mes}/${anio}`, actividad, dieta, pesoMeta, usuario, correo, tipoDieta, intolerancias.join(", "), alimentosRestringidos.join(", "), contrasena]
    );

    res.json({ mensaje: 'Usuario guardado correctamente' });
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      const esCorreo = err.constraint.includes('correo');
      return res.status(400).json({
        error: esCorreo ? 'El correo ya está registrado' : 'El usuario ya está en uso'
      });
    }
    res.status(500).send('Error al guardar');
  }
});

// Login
app.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM usuarios WHERE usuario = $1 AND contrasena = $2',
      [usuario, contrasena]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    res.json({ mensaje: 'Login exitoso', usuario: { id: result.rows[0].id, nombre: result.rows[0].usuario } });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al iniciar sesión');
  }
});

// Verificar alimento
app.post('/verificar-alimento', async (req, res) => {
  const { usuario, alimento } = req.body;

  const categorias = {
    "Lactosa": ["leche", "queso", "mantequilla", "yogur", "crema", "helado", "butter", "nata", "suero"],
    "Gluten": ["trigo", "pan", "harina", "cebada", "centeno", "pasta", "galleta", "cerveza", "avena"],
    "vegano": ["carne", "pollo", "cerdo", "vacuno", "pescado", "atun", "salmon", "camarones", "huevo", "leche", "queso", "miel", "mantequilla", "yogur"],
    "vegetariano": ["carne", "pollo", "cerdo", "vacuno", "pescado", "atun", "salmon", "camarones", "marisco"],
    "pescetariano": ["carne", "pollo", "cerdo", "vacuno"],
    "keto": ["arroz", "pan", "pasta", "azucar", "harina", "papa", "maiz", "avena", "galleta"],
  };

  try {
    const result = await pool.query(
      'SELECT intolerancias, alimentos_restringidos, tipo_dieta FROM usuarios WHERE usuario = $1',
      [usuario]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { intolerancias, alimentos_restringidos, tipo_dieta } = result.rows[0];
    const alimentoLower = alimento.toLowerCase();

    // Verificar alimentos restringidos personalizados
    const listaRestringidos = alimentos_restringidos
      ? alimentos_restringidos.toLowerCase().split(', ')
      : [];

    const restriccionPersonal = listaRestringidos.find(r =>
      r !== 'ninguna' && alimentoLower.includes(r)
    );

    if (restriccionPersonal) {
      return res.json({
        seguro: false,
        mensaje: `⚠️ Tienes "${restriccionPersonal}" en tu lista de alimentos restringidos.`
      });
    }

    // Verificar intolerancias
    const listaIntolerancias = intolerancias
      ? intolerancias.split(', ')
      : [];

    for (const intolerancia of listaIntolerancias) {
      if (intolerancia === 'Ninguna') continue;
      const alimentosIntolerancia = categorias[intolerancia] || [];
      const conflicto = alimentosIntolerancia.find(a => alimentoLower.includes(a));
      if (conflicto) {
        return res.json({
          seguro: false,
          mensaje: `⚠️ Este alimento contiene ${intolerancia.toLowerCase()} (${conflicto}). No es recomendado para ti.`
        });
      }
    }

    // Verificar tipo de dieta
    if (tipo_dieta && tipo_dieta !== 'omnivoro') {
      const alimentosDieta = categorias[tipo_dieta] || [];
      const conflictoDieta = alimentosDieta.find(a => alimentoLower.includes(a));
      if (conflictoDieta) {
        return res.json({
          seguro: false,
          mensaje: `⚠️ "${alimento}" no es compatible con tu dieta ${tipo_dieta} (contiene ${conflictoDieta}).`
        });
      }
    }

    res.json({ seguro: true, mensaje: '✅ Este alimento es compatible con tus restricciones.' });

    
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al verificar');
  }
});

app.post('/api/actividades', async (req, res) => {
  const { usuario_id, tipo_actividad, intensidad, duracion_minutos } = req.body;

  if (!tipo_actividad || !duracion_minutos) {
    return res.status(400).json({ 
      error: 'El tipo de actividad y la duración son obligatorios.'
    });
  }

  try {
    let factorIntensidad = 5; 
    if (intensidad === 'media') factorIntensidad = 8;
    if (intensidad === 'alta') factorIntensidad = 12;

    const calorias_quemadas = duracion_minutos * factorIntensidad;

    const result = await pool.query(
      `INSERT INTO actividad_fisica (usuario_id, tipo_actividad, intensidad, duracion_minutos, calorias_quemadas)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [usuario_id, tipo_actividad, intensidad, duracion_minutos, calorias_quemadas]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar la actividad física' });
  }
});

app.get('/', (req, res) => {
  res.send('¡Bienvenido! Usa /save para guardar un mensaje y /messages para verlos.');
});

app.post('/guardar-alimento', async (req, res) => {
  const { usuario, alimento, seguro, mensaje } = req.body;
  try {
    await pool.query(
      `INSERT INTO historial_alimentos (usuario, alimento, seguro, mensaje)
       VALUES ($1, $2, $3, $4)`,
      [usuario, alimento, seguro, mensaje]
    );
    res.json({ mensaje: 'Alimento guardado en historial' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar');
  }
});

// Comunidad - Crear publicación
app.post('/publicaciones', async (req, res) => {
  const { titulo, texto, usuario } = req.body;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS publicaciones (
        id SERIAL PRIMARY KEY,
        titulo TEXT NOT NULL,
        texto TEXT NOT NULL,
        fecha_creacion TIMESTAMP DEFAULT NOW(),
        likes INTEGER DEFAULT 0,
        usuario_id INTEGER REFERENCES usuarios(id)
      )
    `);

    const usuarioResult = await pool.query(
      'SELECT id FROM usuarios WHERE usuario = $1',
      [usuario]
    );
    const usuario_id = usuarioResult.rows[0].id;

    await pool.query(
      `INSERT INTO publicaciones (titulo, texto, usuario_id) VALUES ($1, $2, $3)`,
      [titulo, texto, usuario_id]
    );

    res.json({ mensaje: 'Publicación creada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al crear publicación');
  }
});

// Comunidad - Obtener todas las publicaciones
app.get('/publicaciones', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, u.usuario FROM publicaciones p
       JOIN usuarios u ON p.usuario_id = u.id
       ORDER BY p.fecha_creacion DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener publicaciones');
  }
});


//Comunidad - Eliminar publicación
app.delete('/publicaciones/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario } = req.body;
  try {
    // Verificar que la publicación pertenece al usuario
    const pub = await pool.query(
      `SELECT p.id FROM publicaciones p
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = $1 AND u.usuario = $2`,
      [id, usuario]
    );
    if (pub.rows.length === 0) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta publicación' });
    }
    // Eliminar comentarios primero (por la clave foránea)
    await pool.query('DELETE FROM comentarios WHERE publicacion_id = $1', [id]);
    await pool.query('DELETE FROM publicaciones WHERE id = $1', [id]);
    res.json({ mensaje: 'Publicación eliminada' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al eliminar');
  }
});

// Comunidad - Crear comentario
app.post('/comentarios', async (req, res) => {
  const { texto, publicacion_id, usuario } = req.body;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id SERIAL PRIMARY KEY,
        texto TEXT NOT NULL,
        fecha_publicacion TIMESTAMP DEFAULT NOW(),
        publicacion_id INTEGER REFERENCES publicaciones(id),
        usuario_id INTEGER REFERENCES usuarios(id)
      )
    `);

    const usuarioResult = await pool.query(
      'SELECT id FROM usuarios WHERE usuario = $1',
      [usuario]
    );
    const usuario_id = usuarioResult.rows[0].id;

    await pool.query(
      `INSERT INTO comentarios (texto, publicacion_id, usuario_id) VALUES ($1, $2, $3)`,
      [texto, publicacion_id, usuario_id]
    );

    res.json({ mensaje: 'Comentario agregado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar comentario');
  }
});

// Comunidad - Obtener comentarios de una publicación
app.get('/comentarios/:publicacion_id', async (req, res) => {
  const { publicacion_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT c.*, u.usuario FROM comentarios c
       JOIN usuarios u ON c.usuario_id = u.id
       WHERE c.publicacion_id = $1
       ORDER BY c.fecha_publicacion ASC`,
      [publicacion_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener comentarios');
  }
});



app.listen(port, () => {
  console.log(`App corriendo en http://localhost:${port}`);
});
