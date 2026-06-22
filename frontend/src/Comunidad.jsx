import { useState, useEffect } from "react";
import "./Comunidad.css";

export default function Comunidad() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [publicando, setPublicando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [textoComentario, setTextoComentario] = useState("");
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  let usuario = null;
  try {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      usuario = JSON.parse(storedUser);
    }
  } catch (error) {
    localStorage.removeItem("usuario");
  }

  useEffect(() => {
    cargarPublicaciones();
  }, []);

  const cargarPublicaciones = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch("http://localhost:3000/publicaciones");
      const data = await respuesta.json();
      if (respuesta.ok) setPublicaciones(data);
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const publicar = async () => {
    if (!titulo.trim() || !texto.trim()) {
      setError("Por favor completa el título y el texto.");
      return;
    }
    setError("");
    setPublicando(true);
    try {
      const respuesta = await fetch("http://localhost:3000/publicaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, texto, usuario: usuario.nombre }),
      });
      const data = await respuesta.json();
      if (respuesta.ok) {
        setTitulo("");
        setTexto("");
        cargarPublicaciones();
      } else {
        setError(data.error || "Error al publicar");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setPublicando(false);
    }
  };

  const eliminarPublicacion = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta publicación?")) return;
    try {
        await fetch(`http://localhost:3000/publicaciones/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: usuario.nombre }),
        });
        cargarPublicaciones();
    } catch {
    }
  };

  const abrirComentarios = async (publicacion) => {
    setPublicacionSeleccionada(publicacion);
    setModalAbierto(true);
    setTextoComentario("");
    setCargandoComentarios(true);
    try {
      const respuesta = await fetch(`http://localhost:3000/comentarios/${publicacion.id}`);
      const data = await respuesta.json();
      if (respuesta.ok) setComentarios(data);
    } catch {
      setComentarios([]);
    } finally {
      setCargandoComentarios(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setPublicacionSeleccionada(null);
    setComentarios([]);
    setTextoComentario("");
  };

  const enviarComentario = async () => {
    if (!textoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      const respuesta = await fetch("http://localhost:3000/comentarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          texto: textoComentario,
          publicacion_id: publicacionSeleccionada.id,
          usuario: usuario.nombre,
        }),
      });
      if (respuesta.ok) {
        setTextoComentario("");
        const resp2 = await fetch(`http://localhost:3000/comentarios/${publicacionSeleccionada.id}`);
        const data2 = await resp2.json();
        if (resp2.ok) setComentarios(data2);
      }
    } catch {
    } finally {
      setEnviandoComentario(false);
    }
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    return fecha.toLocaleDateString("es-CL", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  return (
    <div className="page">
      <main className="main">
        {usuario && (
          <div className="card">
            <h2 className="cardTitle">Nueva publicación</h2>
            <div className="divider" />
            <div className="cardBody">
              <div className="campo">
                <label className="label">Título:</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Escribe un título..."
                  className="input"
                />
              </div>
              <div className="campo">
                <label className="label">Texto:</label>
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="¿Qué quieres compartir con la comunidad?"
                  className="textarea"
                  rows={4}
                />
              </div>
              {error && <p className="errorMsg">{error}</p>}
              <button className="btnPrimary" onClick={publicar} disabled={publicando}>
                {publicando ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="cardTitle">Publicaciones recientes</h2>
          <div className="divider" />
          <div className="cardBody">
            {cargando && <p className="infoTexto">Cargando publicaciones...</p>}
            {!cargando && publicaciones.length === 0 && (
              <p className="infoTexto">No hay publicaciones aún. ¡Sé el primero en publicar!</p>
            )}
            {publicaciones.map(pub => (
              <div key={pub.id} className="publicacion">
                <div className="pubHeader">
                    <span className="pubUsuario">👤 {pub.usuario}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="pubFecha">{formatearFecha(pub.fecha_creacion)}</span>
                        {usuario && pub.usuario === usuario.nombre && (
                        <button className="btnEliminar" onClick={() => eliminarPublicacion(pub.id)}>
                            🗑️
                        </button>
                        )}
                    </div>
                    </div>
                <h3 className="pubTitulo">{pub.titulo}</h3>
                <p className="pubTexto">{pub.texto}</p>
                <div className="pubFooter">
                  <button className="btnComentarios" onClick={() => abrirComentarios(pub)}>
                    💬 Comentarios
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {modalAbierto && publicacionSeleccionada && (
        <div className="modalOverlay" onClick={cerrarModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modalHeader">
              <h3 className="modalTitulo">{publicacionSeleccionada.titulo}</h3>
              <button className="btnCerrar" onClick={cerrarModal}>✕</button>
            </div>
            <p className="modalTexto">{publicacionSeleccionada.texto}</p>
            <div className="divider" />

            <div className="comentariosList">
              {cargandoComentarios && <p className="infoTexto">Cargando comentarios...</p>}
              {!cargandoComentarios && comentarios.length === 0 && (
                <p className="infoTexto">Sin comentarios aún.</p>
              )}
              {comentarios.map(c => (
                <div key={c.id} className="comentario">
                  <div className="comentarioHeader">
                    <span className="comentarioUsuario">👤 {c.usuario}</span>
                    <span className="pubFecha">{formatearFecha(c.fecha_publicacion)}</span>
                  </div>
                  <p className="comentarioTexto">{c.texto}</p>
                </div>
              ))}
            </div>

            {usuario && (
              <div className="comentarBox">
                <div className="divider" />
                <textarea
                  value={textoComentario}
                  onChange={e => setTextoComentario(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="textarea"
                  style={{ marginTop: 12 }}
                  rows={3}
                />
                <button
                  className="btnPrimary"
                  onClick={enviarComentario}
                  disabled={enviandoComentario}
                >
                  {enviandoComentario ? "Enviando..." : "Comentar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
