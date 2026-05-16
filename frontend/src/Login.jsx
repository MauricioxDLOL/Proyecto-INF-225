import { useState } from "react";
import { useNavigate } from "react-router-dom";

const teal = "#3db39e";

export default function Login() {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!usuario.trim() || !contrasena.trim()) {
      setError("Por favor ingresa tu usuario y contraseña");
      return;
    }
    setError("");
    setCargando(true);
    try {
      const respuesta = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena }),
      });
      const data = await respuesta.json();
      if (respuesta.ok) {
        localStorage.setItem("usuario", data.usuario);
        navigate("/");
      } else {
        setError(data.error || "Error al iniciar sesión");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🔒</span>
            <span style={styles.logoText}>fatsecret</span>
          </div>
          <span style={styles.headerTitle}>Iniciar Sesión</span>
        </div>
        <div style={styles.divider} />
        <div style={styles.body}>

          <div style={styles.campo}>
            <label style={styles.label}>Usuario:</label>
            <input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              style={styles.input}
              placeholder="Tu nombre de usuario"
            />
          </div>

          <div style={styles.campo}>
            <label style={styles.label}>Contraseña:</label>
            <input
              type="password"
              value={contrasena}
              onChange={e => setContrasena(e.target.value)}
              style={styles.input}
              placeholder="Tu contraseña"
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          {error && <p style={styles.errorMsg}>{error}</p>}

          <button style={styles.btnPrimary} onClick={handleLogin} disabled={cargando}>
            {cargando ? "Entrando..." : "Iniciar Sesión"}
          </button>

          <p style={styles.linkTexto}>
            ¿No tienes cuenta?{" "}
            <span style={styles.link} onClick={() => navigate("/registro")}>
              Regístrate aquí
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh", backgroundColor: "#f5f5f0",
    display: "flex", justifyContent: "center", alignItems: "center",
    fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 14, color: "#333",
  },
  card: {
    backgroundColor: "#fff", border: "1px solid #ddd",
    borderRadius: 4, width: "100%", maxWidth: 420,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: { color: teal, fontSize: 22, fontWeight: "bold", fontStyle: "italic" },
  headerTitle: { color: "#7ab", fontSize: 18 },
  divider: { height: 1, backgroundColor: "#e0e0e0" },
  body: { padding: "24px 32px 32px" },
  campo: { marginBottom: 16 },
  label: { display: "block", color: "#555", fontSize: 13, marginBottom: 6 },
  input: {
    width: "100%", padding: "7px 10px", border: "1px solid #ccc",
    borderRadius: 3, fontSize: 13, outline: "none", boxSizing: "border-box",
  },
  errorMsg: { color: "#e55", fontSize: 12, marginBottom: 12 },
  btnPrimary: {
    width: "100%", padding: "9px", backgroundColor: teal,
    border: "none", borderRadius: 3, fontSize: 14,
    cursor: "pointer", color: "#fff", fontWeight: "bold", marginTop: 4,
  },
  linkTexto: { textAlign: "center", marginTop: 16, color: "#666", fontSize: 13 },
  link: { color: teal, cursor: "pointer", fontWeight: "bold" },
};