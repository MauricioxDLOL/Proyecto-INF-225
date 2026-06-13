import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const teal = "#3db39e";

export default function Comunidad() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [publicando, setPublicando] = useState(false);

  // Estado para comentarios
  const [modalAbierto, setModalAbierto] = useState(false);
  const [publicacionSeleccionada, setPublicacionSeleccionada] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [textoComentario, setTextoComentario] = useState("");
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [enviandoComentario, setEnviandoComentario] = useState(false);

  const navigate = useNavigate();
  const usuario = localStorage.getItem("usuario");

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
        body: JSON.stringify({ titulo, texto, usuario }),
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
        body: JSON.stringify({ usuario }),
        });
        cargarPublicaciones();
    } catch {
        // silencioso
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
          usuario,
        }),
      });
      if (respuesta.ok) {
        setTextoComentario("");
        // Recargar comentarios
        const resp2 = await fetch(`http://localhost:3000/comentarios/${publicacionSeleccionada.id}`);
        const data2 = await resp2.json();
        if (resp2.ok) setComentarios(data2);
      }
    } catch {
      // silencioso
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

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div style={styles.page}>
      {/* NAVBAR */}
      <header style={styles.header}>
        <div style={styles.topBar}>
          <h1 style={styles.logo}>Fatsecret</h1>
          <div style={styles.searchBar}>
            <input type="text" placeholder="Buscar alimentos..." style={styles.searchInput} />
            <button style={styles.searchBtn}>🔍</button>
          </div>
          <nav style={styles.userNav}>
            {usuario ? (
              <>
                <span style={styles.bienvenida}>Hola, {usuario} 👋</span>
                <button style={styles.navBtn} onClick={cerrarSesion}>Cerrar sesión</button>
              </>
            ) : (
              <>
                <button style={styles.navBtn} onClick={() => navigate("/login")}>Iniciar sesión</button>
                <button style={styles.navBtn} onClick={() => navigate("/registro")}>Registrarse</button>
              </>
            )}
          </nav>
        </div>
        <div style={styles.mainNav}>
          <button style={styles.mainNavBtn} onClick={() => navigate("/")}>Inicio</button>
          <button style={{ ...styles.mainNavBtn, ...styles.mainNavBtnActive }}>Comunidad</button>
          <button style={styles.mainNavBtn} onClick={() => navigate("/agregar")}>Alimentos</button>
          <button style={styles.mainNavBtn} onClick={() => navigate("/metas")}>Metas</button>
          <button style={styles.mainNavBtn} onClick={() => navigate("/perfil")}>Perfil</button>
        </div>
      </header>

      <main style={styles.main}>

        {/* CAJA PUBLICAR — solo si está logueado */}
        {usuario && (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>Nueva publicación</h2>
            <div style={styles.divider} />
            <div style={styles.cardBody}>
              <div style={styles.campo}>
                <label style={styles.label}>Título:</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="Escribe un título..."
                  style={styles.input}
                />
              </div>
              <div style={styles.campo}>
                <label style={styles.label}>Texto:</label>
                <textarea
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  placeholder="¿Qué quieres compartir con la comunidad?"
                  style={styles.textarea}
                  rows={4}
                />
              </div>
              {error && <p style={styles.errorMsg}>{error}</p>}
              <button style={styles.btnPrimary} onClick={publicar} disabled={publicando}>
                {publicando ? "Publicando..." : "Publicar"}
              </button>
            </div>
          </div>
        )}

        {/* PUBLICACIONES */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Publicaciones recientes</h2>
          <div style={styles.divider} />
          <div style={styles.cardBody}>
            {cargando && <p style={styles.infoTexto}>Cargando publicaciones...</p>}
            {!cargando && publicaciones.length === 0 && (
              <p style={styles.infoTexto}>No hay publicaciones aún. ¡Sé el primero en publicar!</p>
            )}
            {publicaciones.map(pub => (
              <div key={pub.id} style={styles.publicacion}>
                <div style={styles.pubHeader}>
                    <span style={styles.pubUsuario}>👤 {pub.usuario}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={styles.pubFecha}>{formatearFecha(pub.fecha_creacion)}</span>
                        {pub.usuario === usuario && (
                        <button style={styles.btnEliminar} onClick={() => eliminarPublicacion(pub.id)}>
                            🗑️
                        </button>
                        )}
                    </div>
                    </div>
                <h3 style={styles.pubTitulo}>{pub.titulo}</h3>
                <p style={styles.pubTexto}>{pub.texto}</p>
                <div style={styles.pubFooter}>
                  <button style={styles.btnComentarios} onClick={() => abrirComentarios(pub)}>
                    💬 Comentarios
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* MODAL COMENTARIOS */}
      {modalAbierto && publicacionSeleccionada && (
        <div style={styles.modalOverlay} onClick={cerrarModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitulo}>{publicacionSeleccionada.titulo}</h3>
              <button style={styles.btnCerrar} onClick={cerrarModal}>✕</button>
            </div>
            <p style={styles.modalTexto}>{publicacionSeleccionada.texto}</p>
            <div style={styles.divider} />

            {/* Lista de comentarios */}
            <div style={styles.comentariosList}>
              {cargandoComentarios && <p style={styles.infoTexto}>Cargando comentarios...</p>}
              {!cargandoComentarios && comentarios.length === 0 && (
                <p style={styles.infoTexto}>Sin comentarios aún.</p>
              )}
              {comentarios.map(c => (
                <div key={c.id} style={styles.comentario}>
                  <div style={styles.comentarioHeader}>
                    <span style={styles.comentarioUsuario}>👤 {c.usuario}</span>
                    <span style={styles.pubFecha}>{formatearFecha(c.fecha_publicacion)}</span>
                  </div>
                  <p style={styles.comentarioTexto}>{c.texto}</p>
                </div>
              ))}
            </div>

            {/* Input comentar — solo si está logueado */}
            {usuario && (
              <div style={styles.comentarBox}>
                <div style={styles.divider} />
                <textarea
                  value={textoComentario}
                  onChange={e => setTextoComentario(e.target.value)}
                  placeholder="Escribe un comentario..."
                  style={{ ...styles.textarea, marginTop: 12 }}
                  rows={3}
                />
                <button
                  style={styles.btnPrimary}
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

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f0",
    fontFamily: "'Segoe UI', Arial, sans-serif",
    fontSize: 14,
    color: "#333",
  },

  // NAVBAR
  header: {
    backgroundColor: "#fff",
    borderBottom: "1px solid #ddd",
    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 32px",
  },
  logo: {
    color: teal,
    fontSize: 22,
    fontWeight: "bold",
    fontStyle: "italic",
    margin: 0,
  },
  searchBar: {
    display: "flex",
    gap: 6,
  },
  searchInput: {
    padding: "6px 10px",
    border: "1px solid #ccc",
    borderRadius: 3,
    fontSize: 13,
    outline: "none",
    width: 220,
  },
  searchBtn: {
    padding: "6px 10px",
    border: "1px solid #ccc",
    borderRadius: 3,
    cursor: "pointer",
    backgroundColor: "#fff",
  },
  userNav: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  bienvenida: {
    color: "#555",
    fontSize: 13,
  },
  navBtn: {
    padding: "6px 14px",
    backgroundColor: teal,
    color: "#fff",
    border: "none",
    borderRadius: 3,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: "bold",
  },
  mainNav: {
    display: "flex",
    gap: 4,
    padding: "0 32px",
    borderTop: "1px solid #f0f0f0",
  },
  mainNavBtn: {
    padding: "10px 16px",
    border: "none",
    backgroundColor: "transparent",
    cursor: "pointer",
    fontSize: 13,
    color: "#555",
  },
  mainNavBtnActive: {
    color: teal,
    fontWeight: "bold",
    borderBottom: `2px solid ${teal}`,
  },

  // MAIN
  main: {
    maxWidth: 720,
    margin: "32px auto",
    padding: "0 16px",
    display: "flex",
    flexDirection: "column",
    gap: 24,
  },

  // CARD
  card: {
    backgroundColor: "#fff",
    border: "1px solid #ddd",
    borderRadius: 4,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  cardTitle: {
    margin: 0,
    padding: "16px 24px",
    fontSize: 16,
    color: "#444",
    fontWeight: "bold",
  },
  cardBody: {
    padding: "16px 24px 24px",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
  },

  // FORM
  campo: { marginBottom: 14 },
  label: {
    display: "block",
    color: "#555",
    fontSize: 13,
    marginBottom: 6,
  },
  input: {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #ccc",
    borderRadius: 3,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  },
  textarea: {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid #ccc",
    borderRadius: 3,
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
    resize: "vertical",
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  errorMsg: { color: "#e55", fontSize: 12, marginBottom: 12 },
  btnPrimary: {
    width: "100%",
    padding: "9px",
    backgroundColor: teal,
    border: "none",
    borderRadius: 3,
    fontSize: 14,
    cursor: "pointer",
    color: "#fff",
    fontWeight: "bold",
    marginTop: 4,
  },

  // PUBLICACIONES
  publicacion: {
    padding: "16px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  pubHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pubUsuario: {
    color: teal,
    fontWeight: "bold",
    fontSize: 13,
  },

  btnEliminar: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 15,
    color: "#ccc",
    padding: "2px 4px",
    borderRadius: 3,
    lineHeight: 1,
  },

  pubFecha: {
    color: "#aaa",
    fontSize: 12,
  },
  pubTitulo: {
    margin: "0 0 6px",
    fontSize: 15,
    color: "#333",
  },
  pubTexto: {
    margin: "0 0 12px",
    color: "#555",
    lineHeight: 1.5,
  },
  pubFooter: {
    display: "flex",
    gap: 10,
  },
  btnComentarios: {
    padding: "5px 14px",
    backgroundColor: "#f5f5f5",
    border: "1px solid #ddd",
    borderRadius: 3,
    cursor: "pointer",
    fontSize: 12,
    color: "#555",
  },
  infoTexto: {
    color: "#aaa",
    fontSize: 13,
    textAlign: "center",
    padding: "16px 0",
  },

  // MODAL
  modalOverlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 6,
    width: "100%",
    maxWidth: 560,
    maxHeight: "80vh",
    overflowY: "auto",
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    padding: "24px",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  modalTitulo: {
    margin: 0,
    fontSize: 16,
    color: "#333",
  },
  btnCerrar: {
    background: "none",
    border: "none",
    fontSize: 18,
    cursor: "pointer",
    color: "#aaa",
    lineHeight: 1,
  },
  modalTexto: {
    color: "#555",
    lineHeight: 1.5,
    marginBottom: 16,
  },

  // COMENTARIOS
  comentariosList: {
    marginTop: 16,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  comentario: {
    backgroundColor: "#f9f9f9",
    border: "1px solid #eee",
    borderRadius: 4,
    padding: "10px 14px",
  },
  comentarioHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  comentarioUsuario: {
    color: teal,
    fontWeight: "bold",
    fontSize: 12,
  },
  comentarioTexto: {
    margin: 0,
    color: "#555",
    fontSize: 13,
    lineHeight: 1.5,
  },
  comentarBox: {
    marginTop: 8,
  },
};