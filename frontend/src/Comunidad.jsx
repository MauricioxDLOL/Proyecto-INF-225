import { useState, useEffect } from "react";
import "./Comunidad.css";
import { Link } from "react-router-dom";

export default function Comunidad() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [imagen, setImagen] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [publicando, setPublicando] = useState(false);

  // Edición
  const [editando, setEditando] = useState(null);
  const [tituloEdit, setTituloEdit] = useState("");
  const [textoEdit, setTextoEdit] = useState("");
  const [imagenEdit, setImagenEdit] = useState(null);

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

  // Convierte un archivo de imagen a base64
  const archivoABase64 = (archivo) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(archivo);
    });
  };

  const manejarImagen = async (e, setter) => {
    const archivo = e.target.files[0];
    if (!archivo) return;
    if (archivo.size > 2 * 1024 * 1024) {
      setError("La imagen es muy grande (máximo 2MB).");
      return;
    }
    const base64 = await archivoABase64(archivo);
    setter(base64);
  };

  const cargarPublicaciones = async () => {
    setCargando(true);
    try {
      const respuesta = await fetch("http://localhost:3000/publicaciones");
      const data = await respuesta.json();
      if (respuesta.ok) setPublicaciones(data);
    } catch {
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
        body: JSON.stringify({ titulo, texto, usuario: usuario.nombre, imagen }),
      });
      const data = await respuesta.json();
      if (respuesta.ok) {
        setTitulo("");
        setTexto("");
        setImagen(null);
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

  const iniciarEdicion = (pub) => {
    setEditando(pub.id);
    setTituloEdit(pub.titulo);
    setTextoEdit(pub.texto);
    setImagenEdit(pub.imagen || null);
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setTituloEdit("");
    setTextoEdit("");
    setImagenEdit(null);
  };

  const guardarEdicion = async (id) => {
    try {
      await fetch(`http://localhost:3000/publicaciones/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: tituloEdit,
          texto: textoEdit,
          usuario: usuario.nombre,
          imagen: imagenEdit,
        }),
      });
      cancelarEdicion();
      cargarPublicaciones();
    } catch {
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


  const eliminarComentario = async (id) => {
  if (!window.confirm("¿Eliminar este comentario?")) return;
  try {
    await fetch(`http://localhost:3000/comentarios/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario: usuario.nombre }),
    });
    const resp = await fetch(`http://localhost:3000/comentarios/${publicacionSeleccionada.id}`);
    const data = await resp.json();
    if (resp.ok) setComentarios(data);
  } catch {
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
    <div className="com-page">
      <main className="com-main">
        {usuario && (
          <div className="com-card">
            <h2 className="com-cardTitle">Nueva publicación</h2>
            <div className="com-divider" />
            <div className="com-cardBody">
              <div className="com-campo">
                <label className="com-label">Título:</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Escribe un título..."
                  className="com-input"
                />
              </div>
              <div className="com-campo">
                <label className="com-label">Texto:</label>
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="¿Qué quieres compartir con la comunidad?"
                  className="com-textarea"
                  rows={4}
                />
              </div>
              <div className="com-campo">
                <label className="com-label">Imagen (opcional):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => manejarImagen(e, setImagen)}
                  className="com-inputFile"
                />
                {imagen && (
                  <div className="com-previewBox">
                    <img src={imagen} alt="preview" className="com-preview" />
                    <button className="com-btnQuitarImg" onClick={() => setImagen(null)}>
                      Quitar imagen
                    </button>
                  </div>
                )}
              </div>
              {error && <p className="com-errorMsg">{error}</p>}
              <button className="com-btnPrimary" onClick={publicar} disabled={publicando}>
                {publicando ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        )}

        <div className="com-card">
          <h2 className="com-cardTitle">Publicaciones recientes</h2>
          <div className="com-divider" />
          <div className="com-cardBody">
            {cargando && <p className="com-infoTexto">Cargando publicaciones...</p>}
            {!cargando && publicaciones.length === 0 && (
              <p className="com-infoTexto">No hay publicaciones aún. ¡Sé el primero en publicar!</p>
            )}
            {publicaciones.map(pub => (
              <div key={pub.id} className="com-publicacion">
                <div className="com-pubHeader">
                  <span className="com-pubUsuario">👤 <Link to={`/miembro/${pub.usuario}`} style={{ color: "inherit", textDecoration: "underline" }}>{pub.usuario}</Link></span>
                  <div className="com-pubHeaderRight">
                    <span className="com-pubFecha">{formatearFecha(pub.fecha_creacion)}</span>
                    {usuario && pub.usuario === usuario.nombre && editando !== pub.id && (
                      <>
                        <button className="com-btnEliminar" onClick={() => iniciarEdicion(pub)}>
                          ✏️
                        </button>
                        <button className="com-btnEliminar" onClick={() => eliminarPublicacion(pub.id)}>
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editando === pub.id ? (
                  <>
                    <input
                      value={tituloEdit}
                      onChange={e => setTituloEdit(e.target.value)}
                      className="com-input com-inputEdit"
                    />
                    <textarea
                      value={textoEdit}
                      onChange={e => setTextoEdit(e.target.value)}
                      className="com-textarea"
                      rows={3}
                    />
                    <div className="com-campo">
                      <label className="com-label">Imagen:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => manejarImagen(e, setImagenEdit)}
                        className="com-inputFile"
                      />
                      {imagenEdit && (
                        <div className="com-previewBox">
                          <img src={imagenEdit} alt="preview" className="com-preview" />
                          <button className="com-btnQuitarImg" onClick={() => setImagenEdit(null)}>
                            Quitar imagen
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="com-editBotones">
                      <button className="com-btnGuardar" onClick={() => guardarEdicion(pub.id)}>
                        Guardar
                      </button>
                      <button className="com-btnComentarios" onClick={cancelarEdicion}>
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="com-pubTitulo">{pub.titulo}</h3>
                    <p className="com-pubTexto">{pub.texto}</p>
                    {pub.imagen && (
                      <img src={pub.imagen} alt="publicación" className="com-pubImagen" />
                    )}
                    <div className="com-pubFooter">
                      <button className="com-btnComentarios" onClick={() => abrirComentarios(pub)}>
                        💬 Comentarios
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {modalAbierto && publicacionSeleccionada && (
        <div className="com-modalOverlay" onClick={cerrarModal}>
          <div className="com-modal" onClick={e => e.stopPropagation()}>
            <div className="com-modalHeader">
              <h3 className="com-modalTitulo">{publicacionSeleccionada.titulo}</h3>
              <button className="com-btnCerrar" onClick={cerrarModal}>✕</button>
            </div>
            <p className="com-modalTexto">{publicacionSeleccionada.texto}</p>
            <div className="com-divider" />

            <div className="com-comentariosList">
              {cargandoComentarios && <p className="com-infoTexto">Cargando comentarios...</p>}
              {!cargandoComentarios && comentarios.length === 0 && (
                <p className="com-infoTexto">Sin comentarios aún.</p>
              )}
              {comentarios.map(c => (
                <div key={c.id} className="com-comentario">
                  <div className="com-comentarioHeader">
                    <span className="com-comentarioUsuario">👤 <Link to={`/miembro/${c.usuario}`} style={{ color: "inherit", textDecoration: "underline" }}>{c.usuario}</Link></span>
                    <div className="com-pubHeaderRight">
                      <span className="com-pubFecha">{formatearFecha(c.fecha_publicacion)}</span>
                      {usuario && c.usuario === usuario.nombre && (
                        <button className="com-btnEliminar" onClick={() => eliminarComentario(c.id)}>
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="com-comentarioTexto">{c.texto}</p>
                </div>
              ))}
            </div>

            {usuario && (
              <div className="com-comentarBox">
                <div className="com-divider" />
                <textarea
                  value={textoComentario}
                  onChange={e => setTextoComentario(e.target.value)}
                  placeholder="Escribe un comentario..."
                  className="com-textarea com-comentarTextarea"
                  rows={3}
                />
                <button
                  className="com-btnPrimary"
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