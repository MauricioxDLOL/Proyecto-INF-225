require("dotenv").config();

const express = require('express');
const pool = require('./db');
const { router: perfilRouter, inicializarPerfil } = require('./perfilPublico');
const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

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
        calorias_quemadas NUMERIC(8, 2)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS resumen_diario (
        id SERIAL PRIMARY KEY,
        usuario TEXT,
        fecha DATE DEFAULT CURRENT_DATE,
        calorias_consumidas NUMERIC DEFAULT 0,
        proteina NUMERIC DEFAULT 0,
        carbohidratos NUMERIC DEFAULT 0,
        grasa NUMERIC DEFAULT 0,
        agua_consumida NUMERIC DEFAULT 0,
        racha INTEGER DEFAULT 0
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS metas (
        usuario TEXT PRIMARY KEY,
        calorias NUMERIC,
        proteina NUMERIC,
        carbohidratos NUMERIC,
        grasa NUMERIC,
        agua NUMERIC
      )
    `);

   
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

    await pool.query(`ALTER TABLE publicaciones ADD COLUMN IF NOT EXISTS imagen TEXT`);

    await pool.query(`
      ALTER TABLE publicaciones
      ADD COLUMN IF NOT EXISTS receta_id INTEGER
      REFERENCES recetas(id) ON DELETE SET NULL
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS comentarios (
        id SERIAL PRIMARY KEY,
        texto TEXT NOT NULL,
        fecha_publicacion TIMESTAMP DEFAULT NOW(),
        publicacion_id INTEGER REFERENCES publicaciones(id),
        usuario_id INTEGER REFERENCES usuarios(id)
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS historial_peso (
        id SERIAL PRIMARY KEY,
        usuario TEXT NOT NULL,
        peso NUMERIC NOT NULL,
        fecha DATE DEFAULT CURRENT_DATE
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS recetas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        nombre TEXT NOT NULL,
        descripcion TEXT,
        instrucciones TEXT NOT NULL,
        porciones INTEGER NOT NULL CHECK (porciones > 0),
        calorias NUMERIC DEFAULT 0,
        proteinas NUMERIC DEFAULT 0,
        carbohidratos NUMERIC DEFAULT 0,
        grasas NUMERIC DEFAULT 0,
        imagen TEXT,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      ALTER TABLE recetas
      ADD COLUMN IF NOT EXISTS restricciones_compatibles
      TEXT[] NOT NULL DEFAULT '{}'
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS receta_ingredientes (
        id SERIAL PRIMARY KEY,
        receta_id INTEGER NOT NULL
          REFERENCES recetas(id) ON DELETE CASCADE,
        spoonacular_id INTEGER NOT NULL,
        nombre TEXT NOT NULL,
        cantidad NUMERIC NOT NULL CHECK (cantidad > 0),
        unidad TEXT DEFAULT 'g',
        calorias NUMERIC DEFAULT 0,
        proteinas NUMERIC DEFAULT 0,
        carbohidratos NUMERIC DEFAULT 0,
        grasas NUMERIC DEFAULT 0
      )
    `);


await pool.query(`
  CREATE TABLE IF NOT EXISTS registro_ingestas (
    id SERIAL PRIMARY KEY,

    usuario_id INTEGER NOT NULL
      REFERENCES usuarios(id),

    tipo VARCHAR(20) NOT NULL
      CHECK (tipo IN ('alimento', 'receta')),

    receta_id INTEGER
      REFERENCES recetas(id) ON DELETE SET NULL,

    nombre TEXT NOT NULL,

    cantidad NUMERIC NOT NULL DEFAULT 1
      CHECK (cantidad > 0),

    unidad VARCHAR(20) NOT NULL,

    calorias NUMERIC NOT NULL DEFAULT 0,
    proteinas NUMERIC NOT NULL DEFAULT 0,
    carbohidratos NUMERIC NOT NULL DEFAULT 0,
    grasas NUMERIC NOT NULL DEFAULT 0,

    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);


    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS tipo_dieta TEXT`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS intolerancias TEXT`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS alimentos_restringidos TEXT`);
    await pool.query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contrasena TEXT`);
    await inicializarPerfil();

    console.log('Tablas inicializadas correctamente');
  } catch (err) {
    console.error('Error inicializando tablas:', err);
  }
};

inicializarDB();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req, res) => res.send('¡Bienvenido!'));
app.get('/save', async (req, res) => {
  try {
    await pool.query('CREATE TABLE IF NOT EXISTS messages (id SERIAL PRIMARY KEY, content TEXT)');
    await pool.query('INSERT INTO messages (content) VALUES ($1)', ['Hola desde PostgreSQL!']);
    res.send('Mensaje guardado en la base de datos');
  } catch (err) {
    res.status(500).send('Error');
  }
});
app.get('/messages', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM messages');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error');
  }
});

app.post('/registro', async (req, res) => {
  const { sexo, peso, altura, mes, dia, anio, actividad, dieta, pesoMeta, usuario, correo, tipoDieta, intolerancias, alimentosRestringidos, contrasena } = req.body;
  try {
    const existente = await pool.query('SELECT * FROM usuarios WHERE correo = $1 OR usuario = $2', [correo, usuario]);
    if (existente.rows.length > 0) {
      const campo = existente.rows[0].correo === correo ? 'correo' : 'usuario';
      return res.status(400).json({ error: `El ${campo} ya está registrado` });
    }

    await pool.query(
      `INSERT INTO usuarios (sexo, peso, altura, fecha_nacimiento, actividad, dieta, peso_meta, usuario, correo, tipo_dieta, intolerancias, alimentos_restringidos, contrasena)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [sexo, peso, altura, `${dia}/${mes}/${anio}`, actividad, dieta, pesoMeta, usuario, correo, tipoDieta, intolerancias.join(", "), alimentosRestringidos.join(", "), contrasena]
    );
    await pool.query(
      `INSERT INTO historial_peso (usuario, peso)
      VALUES ($1, $2)`,
      [usuario, peso]
    );

    
    const edad = new Date().getFullYear() - parseInt(anio, 10);
    const pesoNum = parseFloat(peso);
    const alturaNum = parseFloat(altura);

    let bmr;
    if (sexo === "masculino") {
      bmr = (10 * pesoNum) + (6.25 * alturaNum) - (5 * edad) + 5;
    } else {
      bmr = (10 * pesoNum) + (6.25 * alturaNum) - (5 * edad) - 161;
    }

    
    const factores = {
      sedentario: 1.2,
      baja: 1.375,
      activo: 1.55,
      muy_activo: 1.725,
    };
    const factor = factores[actividad] || 1.2;
    let calorias = bmr * factor;

   
    if (dieta === "Pérdida de peso leve") calorias -= 300;
    else if (dieta === "Pérdida de peso") calorias -= 500;
    else if (dieta === "Pérdida de peso intensa") calorias -= 750;
    else if (dieta === "Ganar peso") calorias += 400;
    

    calorias = Math.round(calorias);

    
    await pool.query(`
      INSERT INTO metas (usuario, calorias) VALUES ($1, $2)
      ON CONFLICT (usuario) DO UPDATE SET calorias = $2
    `, [usuario, calorias]);

    res.json({ mensaje: 'Usuario guardado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al guardar');
  }
});

app.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;
  try {
    const result = await pool.query('SELECT * FROM usuarios WHERE usuario = $1 AND contrasena = $2', [usuario, contrasena]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    res.json({ mensaje: 'Login exitoso', usuario: { id: result.rows[0].id, nombre: result.rows[0].usuario } });
  } catch (err) {
    res.status(500).send('Error al iniciar sesión');
  }
});

app.get('/usuario/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT usuario, peso, peso_meta, tipo_dieta, intolerancias, alimentos_restringidos
       FROM usuarios WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Error al obtener usuario');
  }
});

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
    const result = await pool.query('SELECT intolerancias, alimentos_restringidos, tipo_dieta FROM usuarios WHERE usuario = $1', [usuario]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const { intolerancias, alimentos_restringidos, tipo_dieta } = result.rows[0];
    const alimentoLower = alimento.toLowerCase();

    const listaRestringidos = alimentos_restringidos ? alimentos_restringidos.toLowerCase().split(', ') : [];
    const restriccionPersonal = listaRestringidos.find(r => r !== 'ninguna' && alimentoLower.includes(r));
    if (restriccionPersonal) return res.json({ seguro: false, mensaje: `⚠️ Tienes "${restriccionPersonal}" en tu lista de alimentos restringidos.` });

    const listaIntolerancias = intolerancias ? intolerancias.split(', ') : [];
    for (const intolerancia of listaIntolerancias) {
      if (intolerancia === 'Ninguna') continue;
      const alimentosIntolerancia = categorias[intolerancia] || [];
      const conflicto = alimentosIntolerancia.find(a => alimentoLower.includes(a));
      if (conflicto) return res.json({ seguro: false, mensaje: `⚠️ Este alimento contiene ${intolerancia.toLowerCase()} (${conflicto}). No es recomendado para ti.` });
    }

    if (tipo_dieta && tipo_dieta !== 'omnivoro') {
      const alimentosDieta = categorias[tipo_dieta] || [];
      const conflictoDieta = alimentosDieta.find(a => alimentoLower.includes(a));
      if (conflictoDieta) return res.json({ seguro: false, mensaje: `⚠️ "${alimento}" no es compatible con tu dieta ${tipo_dieta} (contiene ${conflictoDieta}).` });
    }

    res.json({ seguro: true, mensaje: '✅ Este alimento es compatible con tus restricciones.' });
  } catch (err) {
    res.status(500).send('Error al verificar');
  }
});


app.post('/guardar-alimento', async (req, res) => {
  const { usuario, alimento, seguro, mensaje } = req.body;
  try {
    await pool.query(`INSERT INTO historial_alimentos (usuario, alimento, seguro, mensaje) VALUES ($1, $2, $3, $4)`, [usuario, alimento, seguro, mensaje]);
    res.json({ mensaje: 'Alimento guardado en historial' });
  } catch (err) {
    res.status(500).send('Error al guardar');
  }
});

app.get('/resumen-diario/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rd.* FROM resumen_diario rd
       JOIN usuarios u ON rd.usuario = u.usuario
       WHERE u.id = $1 ORDER BY rd.fecha DESC LIMIT 1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.json({ calorias_consumidas: 0, proteina: 0, carbohidratos: 0, grasa: 0, agua_consumida: 0, racha: 0 });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Error al obtener resumen diario');
  }
});

app.post('/api/actividades', async (req, res) => {
  const { usuario_id, tipo_actividad, intensidad, duracion_minutos } = req.body;
  if (!tipo_actividad || !duracion_minutos) return res.status(400).json({ error: 'El tipo de actividad y la duración son obligatorios.' });

  try {
    let factorIntensidad = intensidad === 'media' ? 8 : intensidad === 'alta' ? 12 : 5;
    const calorias_quemadas = duracion_minutos * factorIntensidad;

    const result = await pool.query(
      `INSERT INTO actividad_fisica (usuario_id, tipo_actividad, intensidad, duracion_minutos, calorias_quemadas) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [usuario_id, tipo_actividad, intensidad, duracion_minutos, calorias_quemadas]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar la actividad física' });
  }
});

app.post('/metas', async (req, res) => {
  const { usuario, calorias, proteina, carbohidratos, grasa, agua } = req.body;
  const val = (v) => v === "" || v === undefined ? null : v;
  try {
    await pool.query(`
      INSERT INTO metas (usuario, calorias, proteina, carbohidratos, grasa, agua) VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (usuario) DO UPDATE SET calorias=$2, proteina=$3, carbohidratos=$4, grasa=$5, agua=$6
    `, [usuario, val(calorias), val(proteina), val(carbohidratos), val(grasa), val(agua)]);
    res.json({ mensaje: "Metas guardadas" });
  } catch (err) {
    res.status(500).send("Error al guardar metas");
  }
});

app.get('/metas/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT m.calorias, m.proteina, m.carbohidratos, m.grasa, m.agua FROM metas m
       JOIN usuarios u ON m.usuario = u.usuario WHERE u.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.json({});
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send("Error al obtener metas");
  }
});

app.post('/recetas', async (req, res) => {
  const {
    usuario,
    nombre,
    descripcion,
    instrucciones,
    porciones,
    ingredientes,
    restricciones_compatibles = []
  } = req.body;

  // Validar los datos generales.
  if (
    typeof usuario !== 'string' || !usuario.trim() ||
    typeof nombre !== 'string' || !nombre.trim() ||
    typeof instrucciones !== 'string' || !instrucciones.trim() ||
    !Number.isInteger(Number(porciones)) ||
    Number(porciones) <= 0 ||
    !Array.isArray(ingredientes) ||
    ingredientes.length === 0
  ) {
    return res.status(400).json({
      error: 'Faltan datos obligatorios de la receta.'
    });
  }

  if (
    !Array.isArray(restricciones_compatibles) ||
    restricciones_compatibles.length > 15 ||
    restricciones_compatibles.some(r =>
      typeof r !== "string" ||
      !r.trim() ||
      r.trim().length > 60
    )
  ) {
    return res.status(400).json({
      error: "Restricciones compatibles inválidas."
    });
  }

  // Validar los ingredientes.
  for (const ingrediente of ingredientes) {
    if (
      !Number.isInteger(Number(ingrediente.id)) ||
      typeof ingrediente.nombre !== 'string' ||
      !ingrediente.nombre.trim() ||
      !Number.isFinite(Number(ingrediente.cantidad)) ||
      Number(ingrediente.cantidad) <= 0 ||
      !ingrediente.nutrientes ||
      ['calorias', 'proteinas', 'carbohidratos', 'grasas']
        .some(macro =>
          !Number.isFinite(Number(ingrediente.nutrientes[macro])) ||
          Number(ingrediente.nutrientes[macro]) < 0
        )
    ) {
      return res.status(400).json({
        error: 'Hay ingredientes con datos inválidos.'
      });
    }
  }

  const cliente = await pool.connect().catch(() => null);

  if (!cliente) {
    return res.status(500).json({
      error: 'No se pudo conectar a la base de datos.'
    });
  }

  try {
    await cliente.query('BEGIN');

    // Obtener el ID del usuario existente.
    const resultadoUsuario = await cliente.query(
      'SELECT id FROM usuarios WHERE usuario = $1',
      [usuario]
    );

    if (resultadoUsuario.rows.length === 0) {
      await cliente.query('ROLLBACK');
      return res.status(404).json({
        error: 'Usuario no encontrado.'
      });
    }

    const usuarioId = resultadoUsuario.rows[0].id;

    // Calcular los nutrientes totales.
    const totales = {
      calorias: 0,
      proteinas: 0,
      carbohidratos: 0,
      grasas: 0
    };

    for (const ingrediente of ingredientes) {
      const factor = Number(ingrediente.cantidad) / 100;

      for (const macro of Object.keys(totales)) {
        totales[macro] +=
          Number(ingrediente.nutrientes[macro]) * factor;
      }
    }

    // Guardar la receta.
    const resultadoReceta = await cliente.query(
      `INSERT INTO recetas
       (usuario_id, nombre, descripcion, instrucciones,
        porciones, calorias, proteinas, carbohidratos, grasas, restricciones_compatibles)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        usuarioId,
        nombre.trim(),
        descripcion || '',
        instrucciones.trim(),
        Number(porciones),
        totales.calorias,
        totales.proteinas,
        totales.carbohidratos,
        totales.grasas,
        restricciones_compatibles.map(r => r.trim())
      ]
    );

    const recetaId = resultadoReceta.rows[0].id;

    // Guardar cada ingrediente.
    for (const ingrediente of ingredientes) {
      const factor = Number(ingrediente.cantidad) / 100;
      const n = ingrediente.nutrientes;

      await cliente.query(
        `INSERT INTO receta_ingredientes
         (receta_id, spoonacular_id, nombre, cantidad,
          unidad, calorias, proteinas, carbohidratos, grasas)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          recetaId,
          ingrediente.id,
          ingrediente.nombre,
          Number(ingrediente.cantidad),
          'g',
          Number(n.calorias) * factor,
          Number(n.proteinas) * factor,
          Number(n.carbohidratos) * factor,
          Number(n.grasas) * factor
        ]
      );
    }

    await cliente.query('COMMIT');

    res.status(201).json({
      mensaje: 'Receta publicada correctamente.',
      receta_id: recetaId
    });

  } catch (error) {
    await cliente.query('ROLLBACK');
    console.error('Error publicando receta:', error);

    res.status(500).json({
      error: 'No se pudo publicar la receta.'
    });

  } finally {
    cliente.release();
  }
});


app.get('/recetas', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        r.id,
        r.nombre,
        r.descripcion,
        r.instrucciones,
        r.porciones,
        r.calorias,
        r.proteinas,
        r.carbohidratos,
        r.grasas,
        r.imagen,
        r.fecha_creacion,
        u.usuario AS autor,
        r.restricciones_compatibles
      FROM recetas r
      JOIN usuarios u ON r.usuario_id = u.id
      ORDER BY r.fecha_creacion DESC, r.id DESC
    `);

    res.json(resultado.rows);

  } catch (error) {
    console.error("Error obteniendo recetas:", error);

    res.status(500).json({
      error: "No se pudieron obtener las recetas."
    });
  }
});


app.get('/recetas/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "ID de receta inválido."
    });
  }

  try {
    const resultadoReceta = await pool.query(
      `SELECT
        r.id,
        r.nombre,
        r.descripcion,
        r.instrucciones,
        r.porciones,
        r.calorias,
        r.proteinas,
        r.carbohidratos,
        r.grasas,
        r.imagen,
        r.fecha_creacion,
        u.usuario AS autor,
        r.restricciones_compatibles
       FROM recetas r
       JOIN usuarios u ON r.usuario_id = u.id
       WHERE r.id = $1`,
      [id]
    );

    if (resultadoReceta.rows.length === 0) {
      return res.status(404).json({
        error: "Receta no encontrada."
      });
    }

    const resultadoIngredientes = await pool.query(
      `SELECT
        id,
        spoonacular_id,
        nombre,
        cantidad,
        unidad,
        calorias,
        proteinas,
        carbohidratos,
        grasas
       FROM receta_ingredientes
       WHERE receta_id = $1
       ORDER BY id`,
      [id]
    );

    res.json({
      ...resultadoReceta.rows[0],
      ingredientes: resultadoIngredientes.rows
    });

  } catch (error) {
    console.error("Error obteniendo receta:", error);

    res.status(500).json({
      error: "No se pudo obtener la receta."
    });
  }
});


async function registrarIngesta(cliente, datos) {
  const {
    usuarioId,
    tipo,
    recetaId = null,
    nombre,
    cantidad,
    unidad,
    calorias,
    proteinas,
    carbohidratos,
    grasas
  } = datos;

  await cliente.query(
    `INSERT INTO registro_ingestas
      (usuario_id, tipo, receta_id, nombre, cantidad,
       unidad, calorias, proteinas, carbohidratos, grasas)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      usuarioId,
      tipo,
      recetaId,
      nombre,
      cantidad,
      unidad,
      calorias,
      proteinas,
      carbohidratos,
      grasas
    ]
  );
}


app.post('/publicaciones', async (req, res) => {
  const { titulo, texto, usuario, imagen } = req.body;
  try {
    const usuarioResult = await pool.query('SELECT id FROM usuarios WHERE usuario = $1', [usuario]);
    await pool.query(
      `INSERT INTO publicaciones (titulo, texto, usuario_id, imagen) VALUES ($1, $2, $3, $4)`,
      [titulo, texto, usuarioResult.rows[0].id, imagen || null]
    );
    res.json({ mensaje: 'Publicación creada correctamente' });
  } catch (err) {
    res.status(500).send('Error al crear publicación');
  }
});

app.post("/compartir-receta", async (req, res) => {
  const { usuario, receta_id, comentario } = req.body;
  if (
    typeof comentario !== "string" ||
    !comentario.trim() ||
    comentario.trim().length > 1000
  ) {
    return res.status(400).json({
      error: "Escribe un comentario de máximo 1000 caracteres."
    });
  }
  const recetaId = Number(receta_id);

  if (
    typeof usuario !== "string" ||
    !usuario.trim() ||
    !Number.isInteger(recetaId) ||
    recetaId <= 0
  ) {
    return res.status(400).json({
      error: "Datos inválidos."
    });
  }

  try {
    const usuarioResult = await pool.query(
      "SELECT id FROM usuarios WHERE usuario = $1",
      [usuario.trim()]
    );

    if (usuarioResult.rows.length === 0) {
      return res.status(404).json({
        error: "Usuario no encontrado."
      });
    }

    const recetaResult = await pool.query(
      "SELECT id, nombre FROM recetas WHERE id = $1",
      [recetaId]
    );

    if (recetaResult.rows.length === 0) {
      return res.status(404).json({
        error: "Receta no encontrada."
      });
    }

    const receta = recetaResult.rows[0];

    const resultado = await pool.query(
      `INSERT INTO publicaciones
       (titulo, texto, usuario_id, receta_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [
        `${usuario.trim()} ha compartido una receta`,
        comentario.trim(),
        usuarioResult.rows[0].id,
        receta.id
      ]
    );

    res.status(201).json({
      mensaje: "Receta compartida en Comunidad.",
      publicacion_id: resultado.rows[0].id
    });

  } catch (error) {
    console.error("Error compartiendo receta:", error);
    res.status(500).json({
      error: "No se pudo compartir la receta."
    });
  }
});




app.get("/publicaciones", async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT
        p.*,
        u.usuario,
        r.nombre AS receta_nombre,
        r.descripcion AS receta_descripcion,
        r.porciones AS receta_porciones,
        r.calorias AS receta_calorias,
        r.proteinas AS receta_proteinas,
        r.carbohidratos AS receta_carbohidratos,
        r.grasas AS receta_grasas
      FROM publicaciones p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN recetas r ON p.receta_id = r.id
      ORDER BY p.fecha_creacion DESC, p.id DESC
    `);

    res.json(resultado.rows);
  } catch (error) {
    console.error("Error obteniendo publicaciones:", error);
    res.status(500).json({
      error: "No se pudieron obtener las publicaciones."
    });
  }
});


app.delete('/publicaciones/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario } = req.body;
  try {
    const pub = await pool.query(`SELECT p.id FROM publicaciones p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = $1 AND u.usuario = $2`, [id, usuario]);
    if (pub.rows.length === 0) return res.status(403).json({ error: 'No tienes permiso para eliminar esta publicación' });
    await pool.query('DELETE FROM comentarios WHERE publicacion_id = $1', [id]);
    await pool.query('DELETE FROM publicaciones WHERE id = $1', [id]);
    res.json({ mensaje: 'Publicación eliminada' });
  } catch (err) {
    res.status(500).send('Error al eliminar');
  }
});

app.put('/publicaciones/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, texto, usuario, imagen } = req.body;
  try {
    const pub = await pool.query(
      `SELECT p.id FROM publicaciones p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = $1 AND u.usuario = $2`,
      [id, usuario]
    );
    if (pub.rows.length === 0) return res.status(403).json({ error: 'No tienes permiso para editar esta publicación' });
    await pool.query(
      'UPDATE publicaciones SET titulo = $1, texto = $2, imagen = $3 WHERE id = $4',
      [titulo, texto, imagen || null, id]
    );
    res.json({ mensaje: 'Publicación actualizada' });
  } catch (err) {
    res.status(500).send('Error al actualizar');
  }
});

app.post('/comentarios', async (req, res) => {
  const { texto, publicacion_id, usuario } = req.body;
  try {
    const usuarioResult = await pool.query('SELECT id FROM usuarios WHERE usuario = $1', [usuario]);
    await pool.query(`INSERT INTO comentarios (texto, publicacion_id, usuario_id) VALUES ($1, $2, $3)`, [texto, publicacion_id, usuarioResult.rows[0].id]);
    res.json({ mensaje: 'Comentario agregado' });
  } catch (err) {
    res.status(500).send('Error al agregar comentario');
  }
});

app.get('/comentarios/:publicacion_id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT c.*, u.usuario FROM comentarios c JOIN usuarios u ON c.usuario_id = u.id WHERE c.publicacion_id = $1 ORDER BY c.fecha_publicacion ASC`, [req.params.publicacion_id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Error al obtener comentarios');
  }
});

app.delete('/comentarios/:id', async (req, res) => {
  const { id } = req.params;
  const { usuario } = req.body;
  try {
    const com = await pool.query(
      `SELECT c.id FROM comentarios c JOIN usuarios u ON c.usuario_id = u.id WHERE c.id = $1 AND u.usuario = $2`,
      [id, usuario]
    );
    if (com.rows.length === 0) return res.status(403).json({ error: 'No tienes permiso para eliminar este comentario' });
    await pool.query('DELETE FROM comentarios WHERE id = $1', [id]);
    res.json({ mensaje: 'Comentario eliminado' });
  } catch (err) {
    res.status(500).send('Error al eliminar comentario');
  }
});

app.get("/buscar-alimentos", async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Falta el término de búsqueda." });
  }

  try {

    const respuestaSpoon = await fetch(
      `https://api.spoonacular.com/food/ingredients/search?query=${query}&number=10&apiKey=${process.env.SPOONACULAR_API_KEY}`
    );

    const data = await respuestaSpoon.json();

    console.log(data);

    const resultadosMapeados = data.results.map(item => ({
      id: item.id,
      name: item.name,
      image: item.image
    }));

    res.json({
      results: resultadosMapeados
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: "Error interno del servidor."
    });

  }
});

 app.get("/informacion-alimento", async (req, res) => {
  const { id, usuario } = req.query;
  if (!id) return res.status(400).json({ error: "Falta el ID del alimento." });

  try {
    console.log(`\n🔍 [Backend] Buscando info en Spoonacular para el ID: ${id}`);
    
    const respuestaSpoon = await fetch(
      `https://api.spoonacular.com/food/ingredients/${id}/information?amount=100&unit=g&apiKey=${process.env.SPOONACULAR_API_KEY}`
    );
    const infoAlimento = await respuestaSpoon.json();

    console.log("📦 [Backend] Respuesta cruda de Spoonacular:", JSON.stringify(infoAlimento.nutrition?.nutrients, null, 2));

    if (!infoAlimento || infoAlimento.status === "failure") {
      return res.status(404).json({ error: "No se encontró información." });
    }

    const nutrientes = infoAlimento.nutrition?.nutrients || [];
    
    const buscarNutriente = (nameKey) => {
      const encontrado = nutrientes.find(n => n.name.toLowerCase() === nameKey.toLowerCase());
      return encontrado ? encontrado.amount : 0;
    };

    const calorias = buscarNutriente("Calories");
    const proteinas = buscarNutriente("Protein");
    const carbohidratos = buscarNutriente("Carbohydrates") || buscarNutriente("Carbohydrates (by difference)");
    const grasas = buscarNutriente("Fat");

    console.log(`✨ [Backend] Mapeo final -> Cal: ${calorias}, Prot: ${proteinas}, Carb: ${carbohidratos}, Grasas: ${grasas}\n`);

    let alertaRestriccion = null; 
    let esSeguro = true;

    if (usuario) {
      const userResult = await pool.query(
        'SELECT intolerancias, alimentos_restringidos, tipo_dieta FROM usuarios WHERE usuario = $1', 
        [usuario]
      );

      if (userResult.rows.length > 0) {
        const { intolerancias, alimentos_restringidos, tipo_dieta } = userResult.rows[0];
        const categorias = {
          "Lactosa": ["milk", "cheese", "butter", "yogurt", "cream", "lactose", "dairy"],
          "Gluten": ["wheat", "bread", "flour", "barley", "rye", "pasta", "gluten"],
          "vegano": ["meat", "chicken", "beef", "pork", "fish", "shrimp", "egg", "milk", "cheese", "honey"],
          "vegetariano": ["meat", "chicken", "beef", "pork", "fish", "shrimp"],
          "keto": ["sugar", "rice", "bread", "pasta", "flour", "potato"]
        };

        const nombreAlimento = (infoAlimento.name || "").toLowerCase();

        if (alimentos_restringidos) {
          const listaRestringidos = alimentos_restringidos.toLowerCase().split(', ');
          const coincidencia = listaRestringidos.find(r => r !== 'ninguna' && r !== '' && nombreAlimento.includes(r));
          if (coincidencia) {
            esSeguro = false;
            alertaRestriccion = `⚠️ ¡Cuidado! Tienes "${coincidencia}" en tus alérgenos restringidos personales.`;
          }
        }

        if (esSeguro && intolerancias) {
          const listaIntolerancias = intolerancias.split(', ');
          for (const intolerancia of listaIntolerancias) {
            const palabrasClave = categorias[intolerancia] || [];
            const conflicto = palabrasClave.find(p => nombreAlimento.includes(p));
            if (conflicto) {
              esSeguro = false;
              alertaRestriccion = `⚠️ Alerta de Alérgeno: Este ingrediente se asocia con tu intolerancia a la ${intolerancia}.`;
              break;
            }
          }
        }
      }
    }

    res.json({
      id: infoAlimento.id,
      name: infoAlimento.name || "Ingrediente",
      seguro: esSeguro,
      mensajeAlerta: alertaRestriccion || "✅ Este alimento es seguro para tus restricciones actuales.",
      nutrientes: { calorias, proteinas, carbohidratos, grasas }
    });

  } catch (error) {
    console.error("🔴 Error en backend:", error);
    res.status(500).json({ error: "Error interno del servidor." });
  }
});

app.post('/peso', async (req, res) => {
  const { usuario, peso } = req.body;

  try {
    await pool.query(
      `INSERT INTO historial_peso (usuario, peso)
       VALUES ($1, $2)`,
      [usuario, peso]
    );

    await pool.query(
      `UPDATE usuarios
       SET peso = $1
       WHERE usuario = $2`,
      [peso, usuario]
    );

    res.json({ mensaje: "Peso registrado correctamente" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al registrar peso");
  }
});

app.get('/peso/:usuario', async (req, res) => {
  const { usuario } = req.params;

  try {
    const result = await pool.query(
      `SELECT peso, fecha
       FROM historial_peso
       WHERE usuario = $1
       ORDER BY fecha ASC`,
      [usuario]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener historial de peso");
  }
});


app.post("/agregar-alimento-diario", async (req, res) => {
  const {
    usuario,
    nombre,
    cantidad = 100,
    calorias,
    proteinas,
    carbohidratos,
    grasas
  } = req.body;

  const gramos = Number(cantidad);
  const macros = [
    calorias,
    proteinas,
    carbohidratos,
    grasas
  ].map(Number);

  if (
    typeof usuario !== "string" ||
    !usuario.trim() ||
    typeof nombre !== "string" ||
    !nombre.trim() ||
    !Number.isFinite(gramos) ||
    gramos <= 0 ||
    macros.some(n => !Number.isFinite(n) || n < 0)
  ) {
    return res.status(400).json({
      error: "Datos de ingesta inválidos."
    });
  }

  const [
    caloriasConsumidas,
    proteinasConsumidas,
    carbohidratosConsumidos,
    grasasConsumidas
  ] = macros;

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query("BEGIN");

    // Obtener el usuario desde la base de datos.
    const resultadoUsuario = await cliente.query(
      "SELECT id FROM usuarios WHERE usuario = $1",
      [usuario.trim()]
    );

    if (resultadoUsuario.rows.length === 0) {
      await cliente.query("ROLLBACK");

      return res.status(404).json({
        error: "Usuario no encontrado."
      });
    }

    const usuarioId = resultadoUsuario.rows[0].id;

    // Bloquear las filas del usuario para evitar
    // actualizaciones simultáneas inconsistentes.
    await cliente.query(
      "SELECT id FROM usuarios WHERE id = $1 FOR UPDATE",
      [usuarioId]
    );

    // Mantener el funcionamiento actual del Home.
    const existe = await cliente.query(
      `SELECT id
       FROM resumen_diario
       WHERE usuario = $1 AND fecha = CURRENT_DATE`,
      [usuario.trim()]
    );

    if (existe.rows.length === 0) {
      await cliente.query(
        `INSERT INTO resumen_diario
         (usuario, calorias_consumidas, proteina,
          carbohidratos, grasa)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          usuario.trim(),
          caloriasConsumidas,
          proteinasConsumidas,
          carbohidratosConsumidos,
          grasasConsumidas
        ]
      );
    } else {
      await cliente.query(
        `UPDATE resumen_diario
         SET calorias_consumidas =
               COALESCE(calorias_consumidas, 0) + $2,
             proteina = COALESCE(proteina, 0) + $3,
             carbohidratos = COALESCE(carbohidratos, 0) + $4,
             grasa = COALESCE(grasa, 0) + $5
         WHERE usuario = $1 AND fecha = CURRENT_DATE`,
        [
          usuario.trim(),
          caloriasConsumidas,
          proteinasConsumidas,
          carbohidratosConsumidos,
          grasasConsumidas
        ]
      );
    }

    // Guardar el alimento consumido.
    await registrarIngesta(cliente, {
      usuarioId,
      tipo: "alimento",
      nombre: nombre.trim(),
      cantidad: gramos,
      unidad: "g",
      calorias: caloriasConsumidas,
      proteinas: proteinasConsumidas,
      carbohidratos: carbohidratosConsumidos,
      grasas: grasasConsumidas
    });

    await cliente.query("COMMIT");

    res.status(201).json({
      mensaje: "Alimento agregado correctamente."
    });

  } catch (error) {
    if (cliente) {
      await cliente.query("ROLLBACK");
    }

    console.error("Error registrando ingesta:", error);

    res.status(500).json({
      error: "No se pudo registrar el alimento."
    });

  } finally {
    if (cliente) cliente.release();
  }
});


app.post("/agregar-receta-diario", async (req, res) => {
  const { usuario_id, receta_id, porciones } = req.body;

  const usuarioId = Number(usuario_id);
  const recetaId = Number(receta_id);
  const cantidad = Number(porciones);

  if (
    !Number.isInteger(usuarioId) || usuarioId <= 0 ||
    !Number.isInteger(recetaId) || recetaId <= 0 ||
    !Number.isFinite(cantidad) || cantidad <= 0
  ) {
    return res.status(400).json({
      error: "Usuario, receta o porciones inválidas."
    });
  }

  let cliente;

  try {
    cliente = await pool.connect();
    await cliente.query("BEGIN");

    // Obtener el usuario y bloquearlo para evitar
    // actualizaciones simultáneas del resumen.
    const resultadoUsuario = await cliente.query(
      "SELECT id, usuario FROM usuarios WHERE id = $1 FOR UPDATE",
      [usuarioId]
    );

    if (resultadoUsuario.rows.length === 0) {
      await cliente.query("ROLLBACK");
      return res.status(404).json({
        error: "Usuario no encontrado."
      });
    }

    const nombreUsuario = resultadoUsuario.rows[0].usuario;

    // Obtener la receta directamente desde PostgreSQL.
    const resultadoReceta = await cliente.query(
      `SELECT id, nombre, porciones, calorias,
              proteinas, carbohidratos, grasas
       FROM recetas
       WHERE id = $1`,
      [recetaId]
    );

    if (resultadoReceta.rows.length === 0) {
      await cliente.query("ROLLBACK");
      return res.status(404).json({
        error: "Receta no encontrada."
      });
    }

    const receta = resultadoReceta.rows[0];

    // La tabla recetas guarda los macros de la receta completa.
    // Primero calculamos los macros de una porción.
    const factor = cantidad / Number(receta.porciones);

    const calorias = Number(receta.calorias) * factor;
    const proteinas = Number(receta.proteinas) * factor;
    const carbohidratos = Number(receta.carbohidratos) * factor;
    const grasas = Number(receta.grasas) * factor;

    // Actualizar el resumen diario existente.
    const resumen = await cliente.query(
      `SELECT id
       FROM resumen_diario
       WHERE usuario = $1 AND fecha = CURRENT_DATE`,
      [nombreUsuario]
    );

    if (resumen.rows.length === 0) {
      await cliente.query(
        `INSERT INTO resumen_diario
         (usuario, calorias_consumidas, proteina,
          carbohidratos, grasa)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          nombreUsuario,
          calorias,
          proteinas,
          carbohidratos,
          grasas
        ]
      );
    } else {
      await cliente.query(
        `UPDATE resumen_diario
         SET calorias_consumidas =
               COALESCE(calorias_consumidas, 0) + $2,
             proteina = COALESCE(proteina, 0) + $3,
             carbohidratos = COALESCE(carbohidratos, 0) + $4,
             grasa = COALESCE(grasa, 0) + $5
         WHERE usuario = $1 AND fecha = CURRENT_DATE`,
        [
          nombreUsuario,
          calorias,
          proteinas,
          carbohidratos,
          grasas
        ]
      );
    }

    // Guardar qué receta consumió el usuario.
    await registrarIngesta(cliente, {
      usuarioId,
      tipo: "receta",
      recetaId,
      nombre: receta.nombre,
      cantidad,
      unidad: "porciones",
      calorias,
      proteinas,
      carbohidratos,
      grasas
    });

    await cliente.query("COMMIT");

    res.status(201).json({
      mensaje: "Receta agregada a tu ingesta diaria.",
      calorias,
      proteinas,
      carbohidratos,
      grasas
    });

  } catch (error) {
    if (cliente) await cliente.query("ROLLBACK");

    console.error("Error agregando receta:", error);

    res.status(500).json({
      error: "No se pudo registrar la receta."
    });

  } finally {
    if (cliente) cliente.release();
  }
});



app.use(perfilRouter);

app.listen(port, () => {
  console.log(`App corriendo en http://localhost:${port}`);
});
