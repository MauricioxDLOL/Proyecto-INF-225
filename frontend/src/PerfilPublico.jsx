// frontend/src/PerfilPublico.jsx
import { useEffect, useState } from "react";
import "./PerfilPublico.css";

const API = "http://localhost:3000";

const LIMITES = { nombre_publico: 50, biografia: 300, ciudad: 60, intereses: 100 };
const RE_NOMBRE = /^[\p{L}\p{N} ._-]+$/u;
const RE_CIUDAD = /^[\p{L} .,'-]+$/u;
const RE_SIN_HTML = /[<>]/;

const FORM_VACIO = {
  nombre_publico: "",
  biografia: "",
  ciudad: "",
  intereses: "",
  es_publico: false,
  mostrar_dieta: false,
  mostrar_intolerancias: false,
  mostrar_restricciones: false,
};

function validar(f) {
  const e = {};
  const nombre = f.nombre_publico.trim();
  if (nombre || f.es_publico) {
    if (nombre.length < 2 || nombre.length > LIMITES.nombre_publico)
      e.nombre_publico = "El nombre público debe tener entre 2 y 50 caracteres.";
    else if (!RE_NOMBRE.test(nombre))
      e.nombre_publico = "Solo letras, números, espacios y . _ -";
  }
  const bio = f.biografia.trim();
  if (bio.length > LIMITES.biografia) e.biografia = "Máximo 300 caracteres.";
  else if (RE_SIN_HTML.test(bio)) e.biografia = "No se permiten los símbolos < y >.";

  const ciudad = f.ciudad.trim();
  if (ciudad.length > LIMITES.ciudad) e.ciudad = "Máximo 60 caracteres.";
  else if (ciudad && !RE_CIUDAD.test(ciudad)) e.ciudad = "Solo letras, espacios y . , ' -";

  const intereses = f.intereses.trim();
  if (intereses.length > LIMITES.intereses) e.intereses = "Máximo 100 caracteres.";
  else if (RE_SIN_HTML.test(intereses)) e.intereses = "No se permiten los símbolos < y >.";
  return e;
}

// La sesión se guarda en localStorage como { id, nombre } (ver Login.jsx)
function usuarioDeSesion() {
  try {
    const guardado = JSON.parse(localStorage.getItem("usuario"));
    return guardado?.nombre || null;
  } catch {
    return null;
  }
}

export default function PerfilPublico({ usuario: usuarioProp }) {
  const usuario = usuarioProp || usuarioDeSesion();
  const [form, setForm] = useState(FORM_VACIO);
  const [restricciones, setRestricciones] = useState({
    tipo_dieta: "",
    intolerancias: "",
    alimentos_restringidos: "",
  });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: "ok" | "error", texto }

  useEffect(() => {
    if (!usuario) return;
    setCargando(true);
    fetch(`${API}/perfil-config/${encodeURIComponent(usuario)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(({ restricciones: rest, ...perfil }) => {
        setForm({ ...FORM_VACIO, ...perfil });
        setRestricciones(rest);
      })
      .catch(() => setMensaje({ tipo: "error", texto: "No se pudo cargar tu perfil." }))
      .finally(() => setCargando(false));
  }, [usuario]);

  const cambiarTexto = (campo) => (ev) => {
    setForm((f) => ({ ...f, [campo]: ev.target.value }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
    setMensaje(null);
  };

  const cambiarSwitch = (campo) => (ev) => {
    const marcado = ev.target.checked;
    setForm((f) =>
      campo === "es_publico" && !marcado
        ? {
            ...f,
            es_publico: false,
            mostrar_dieta: false,
            mostrar_intolerancias: false,
            mostrar_restricciones: false,
          }
        : { ...f, [campo]: marcado }
    );
    setMensaje(null);
  };

  const guardar = async (ev) => {
    ev.preventDefault();
    const e = validar(form);
    setErrores(e);
    if (Object.keys(e).length > 0) {
      setMensaje({ tipo: "error", texto: "Revisa los campos marcados." });
      return;
    }
    setGuardando(true);
    try {
      const r = await fetch(`${API}/perfil-config/${encodeURIComponent(usuario)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (!r.ok) {
        if (data.errores) setErrores(data.errores);
        setMensaje({ tipo: "error", texto: data.error || "No se pudo guardar." });
      } else {
        setMensaje({ tipo: "ok", texto: data.mensaje });
      }
    } catch {
      setMensaje({ tipo: "error", texto: "Error de conexión con el servidor." });
    } finally {
      setGuardando(false);
    }
  };

  if (!usuario) return <p className="pp-aviso">Inicia sesión para configurar tu perfil.</p>;
  if (cargando) return <p className="pp-aviso">Cargando perfil…</p>;

  const campoTexto = (campo, etiqueta, { area = false, placeholder = "" } = {}) => {
    const Tag = area ? "textarea" : "input";
    return (
      <div className="pp-campo">
        <label htmlFor={campo}>{etiqueta}</label>
        <Tag
          id={campo}
          value={form[campo]}
          onChange={cambiarTexto(campo)}
          maxLength={LIMITES[campo]}
          placeholder={placeholder}
          rows={area ? 4 : undefined}
          className={errores[campo] ? "pp-invalido" : ""}
        />
        <div className="pp-pie">
          <span className="pp-error">{errores[campo]}</span>
          <span className="pp-contador">
            {form[campo].length}/{LIMITES[campo]}
          </span>
        </div>
      </div>
    );
  };

  const interruptor = (campo, titulo, detalle, valorActual) => {
    const bloqueado = campo !== "es_publico" && !form.es_publico;
    return (
    <label className={`pp-switch${bloqueado ? " pp-deshabilitado" : ""}`}>
      <input
        type="checkbox"
        checked={form[campo]}
        onChange={cambiarSwitch(campo)}
        disabled={bloqueado}
      />
      <span>
        <strong>{titulo}</strong>
        <small>{detalle}</small>
        {valorActual !== undefined && (
          <small className="pp-valor">Actual: {valorActual || "Sin registrar"}</small>
        )}
      </span>
    </label>
    );
  };

  return (
    <form className="pp-contenedor" onSubmit={guardar} noValidate>
      <h2>Configuración de perfil público</h2>
      <p className="pp-intro">
        Decide qué información pueden ver otros usuarios de la comunidad.
      </p>

      <section>
        <h3>Visibilidad</h3>
        {interruptor(
          "es_publico",
          "Hacer mi perfil público",
          "Si está desactivado, nadie más podrá ver tu perfil."
        )}
      </section>

      <section>
        <h3>Información pública</h3>
        {campoTexto("nombre_publico", "Nombre público *", { placeholder: "Cómo quieres que te vean" })}
        {campoTexto("biografia", "Biografía", { area: true, placeholder: "Cuéntanos sobre ti" })}
        {campoTexto("ciudad", "Ciudad", { placeholder: "Ej: Santiago" })}
        {campoTexto("intereses", "Intereses", { placeholder: "Ej: running, cocina saludable" })}
      </section>

      <section>
        <h3>Restricciones alimentarias visibles</h3>
        {!form.es_publico && (
          <p className="pp-intro">Activa tu perfil público para elegir qué restricciones mostrar.</p>
        )}
        {interruptor(
          "mostrar_dieta",
          "Mostrar mi tipo de dieta",
          "Se mostrará en tu perfil público.",
          restricciones.tipo_dieta
        )}
        {interruptor(
          "mostrar_intolerancias",
          "Mostrar mis intolerancias",
          "Se mostrará en tu perfil público.",
          restricciones.intolerancias
        )}
        {interruptor(
          "mostrar_restricciones",
          "Mostrar mis alimentos restringidos",
          "Se mostrará en tu perfil público.",
          restricciones.alimentos_restringidos
        )}
      </section>

      {mensaje && (
        <p className={mensaje.tipo === "ok" ? "pp-msg-ok" : "pp-msg-error"} role="status">
          {mensaje.texto}
        </p>
      )}

      <button type="submit" disabled={guardando}>
        {guardando ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}