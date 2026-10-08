// perfilPublico.js  (va en la RAÍZ del proyecto, junto a index.js y db.js)
const express = require('express');
const pool = require('./db');

const router = express.Router();

// ---------- Tabla ----------
const inicializarPerfil = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS perfil_publico (
      usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id) ON DELETE CASCADE,
      nombre_publico VARCHAR(50),
      biografia VARCHAR(300),
      ciudad VARCHAR(60),
      intereses VARCHAR(100),
      es_publico BOOLEAN NOT NULL DEFAULT FALSE,
      mostrar_dieta BOOLEAN NOT NULL DEFAULT FALSE,
      mostrar_intolerancias BOOLEAN NOT NULL DEFAULT FALSE,
      mostrar_restricciones BOOLEAN NOT NULL DEFAULT FALSE,
      fecha_actualizacion TIMESTAMP DEFAULT NOW()
    )
  `);
};

// ---------- Validaciones ----------
const limpiar = (v) => (typeof v === 'string' ? v.trim() : '');
const RE_NOMBRE = /^[\p{L}\p{N} ._-]+$/u;
const RE_CIUDAD = /^[\p{L} .,'-]+$/u;
const RE_SIN_HTML = /[<>]/;

function validar(body) {
  const errores = {};
  const datos = {
    nombre_publico: limpiar(body.nombre_publico),
    biografia: limpiar(body.biografia),
    ciudad: limpiar(body.ciudad),
    intereses: limpiar(body.intereses),
    es_publico: body.es_publico === true,
    mostrar_dieta: body.mostrar_dieta === true,
    mostrar_intolerancias: body.mostrar_intolerancias === true,
    mostrar_restricciones: body.mostrar_restricciones === true,
  };

  // Un perfil privado no puede tener restricciones visibles
  if (!datos.es_publico) {
    datos.mostrar_dieta = false;
    datos.mostrar_intolerancias = false;
    datos.mostrar_restricciones = false;
  }

  // Nombre: obligatorio solo si el perfil será público
  if (datos.nombre_publico || datos.es_publico) {
    if (datos.nombre_publico.length < 2 || datos.nombre_publico.length > 50) {
      errores.nombre_publico = 'El nombre público debe tener entre 2 y 50 caracteres.';
    } else if (!RE_NOMBRE.test(datos.nombre_publico)) {
      errores.nombre_publico = 'Solo letras, números, espacios y . _ -';
    }
  }
  if (datos.biografia.length > 300) errores.biografia = 'Máximo 300 caracteres.';
  else if (RE_SIN_HTML.test(datos.biografia)) errores.biografia = 'No se permiten los símbolos < y >.';

  if (datos.ciudad.length > 60) errores.ciudad = 'Máximo 60 caracteres.';
  else if (datos.ciudad && !RE_CIUDAD.test(datos.ciudad)) errores.ciudad = 'Solo letras, espacios y . , \' -';

  if (datos.intereses.length > 100) errores.intereses = 'Máximo 100 caracteres.';
  else if (RE_SIN_HTML.test(datos.intereses)) errores.intereses = 'No se permiten los símbolos < y >.';

  return { errores, datos };
}

const aLista = (txt) =>
  (txt || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s.toLowerCase() !== 'ninguna');

// ---------- GET configuración propia (para llenar el formulario) ----------
router.get('/perfil-config/:usuario', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.tipo_dieta, u.intolerancias, u.alimentos_restringidos,
              p.nombre_publico, p.biografia, p.ciudad, p.intereses,
              p.es_publico, p.mostrar_dieta, p.mostrar_intolerancias, p.mostrar_restricciones
       FROM usuarios u
       LEFT JOIN perfil_publico p ON p.usuario_id = u.id
       WHERE u.usuario = $1`,
      [req.params.usuario]
    );
    if (r.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    const f = r.rows[0];
    res.json({
      nombre_publico: f.nombre_publico || '',
      biografia: f.biografia || '',
      ciudad: f.ciudad || '',
      intereses: f.intereses || '',
      es_publico: f.es_publico || false,
      mostrar_dieta: f.mostrar_dieta || false,
      mostrar_intolerancias: f.mostrar_intolerancias || false,
      mostrar_restricciones: f.mostrar_restricciones || false,
      restricciones: {
        tipo_dieta: f.tipo_dieta || '',
        intolerancias: f.intolerancias || '',
        alimentos_restringidos: f.alimentos_restringidos || '',
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener la configuración del perfil' });
  }
});

// ---------- PUT guardar configuración ----------
router.put('/perfil-config/:usuario', async (req, res) => {
  const { errores, datos } = validar(req.body || {});
  if (Object.keys(errores).length > 0) {
    return res.status(400).json({ error: 'Datos inválidos', errores });
  }
  try {
    const u = await pool.query('SELECT id FROM usuarios WHERE usuario = $1', [req.params.usuario]);
    if (u.rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    await pool.query(
      `INSERT INTO perfil_publico
         (usuario_id, nombre_publico, biografia, ciudad, intereses,
          es_publico, mostrar_dieta, mostrar_intolerancias, mostrar_restricciones, fecha_actualizacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
       ON CONFLICT (usuario_id) DO UPDATE SET
         nombre_publico = EXCLUDED.nombre_publico,
         biografia = EXCLUDED.biografia,
         ciudad = EXCLUDED.ciudad,
         intereses = EXCLUDED.intereses,
         es_publico = EXCLUDED.es_publico,
         mostrar_dieta = EXCLUDED.mostrar_dieta,
         mostrar_intolerancias = EXCLUDED.mostrar_intolerancias,
         mostrar_restricciones = EXCLUDED.mostrar_restricciones,
         fecha_actualizacion = NOW()`,
      [
        u.rows[0].id,
        datos.nombre_publico || null,
        datos.biografia || null,
        datos.ciudad || null,
        datos.intereses || null,
        datos.es_publico,
        datos.mostrar_dieta,
        datos.mostrar_intolerancias,
        datos.mostrar_restricciones,
      ]
    );
    res.json({ mensaje: 'Perfil público actualizado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar el perfil público' });
  }
});

// ---------- GET vista pública (lo que ven otros usuarios) ----------
router.get('/perfil-publico/:usuario', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.usuario, u.tipo_dieta, u.intolerancias, u.alimentos_restringidos,
              p.nombre_publico, p.biografia, p.ciudad, p.intereses,
              p.es_publico, p.mostrar_dieta, p.mostrar_intolerancias, p.mostrar_restricciones
       FROM usuarios u
       JOIN perfil_publico p ON p.usuario_id = u.id
       WHERE u.usuario = $1`,
      [req.params.usuario]
    );
    // Mismo mensaje si no existe o es privado, para no revelar quién tiene cuenta
    if (r.rows.length === 0 || !r.rows[0].es_publico) {
      return res.status(404).json({ error: 'Este perfil no está disponible' });
    }
    const f = r.rows[0];
    const perfil = {
      usuario: f.usuario,
      nombre_publico: f.nombre_publico,
      biografia: f.biografia,
      ciudad: f.ciudad,
      intereses: f.intereses,
    };
    if (f.mostrar_dieta) perfil.tipo_dieta = f.tipo_dieta;
    if (f.mostrar_intolerancias) perfil.intolerancias = aLista(f.intolerancias);
    if (f.mostrar_restricciones) perfil.alimentos_restringidos = aLista(f.alimentos_restringidos);
    res.json(perfil);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el perfil' });
  }
});

module.exports = { router, inicializarPerfil };