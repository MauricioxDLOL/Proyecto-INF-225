import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const teal = "#3db39e";

export default function VerificarAlimento() {
  const [alimento, setAlimento] = useState("");
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [guardado, setGuardado] = useState(false);
  const navigate = useNavigate();
 
let usuario = null;
try {
  const stored = localStorage.getItem("usuario");
  if (stored) {
    const obj = JSON.parse(stored);
    usuario = typeof obj === 'string' ? obj : obj?.nombre;
  }
} catch {}

  useEffect(() => {
    if (!usuario) navigate("/");
  }, []);

  const verificar = async () => {
    if (!alimento.trim()) {
      setError("Por favor ingresa un alimento.");
      return;
    }
    setError("");
    setCargando(true);
    setResultado(null);
    setGuardado(false);
    try {
      const respuesta = await fetch("http://localhost:3000/verificar-alimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, alimento }),
      });
      const data = await respuesta.json();
      if (respuesta.ok) {
        setResultado(data);
        // Si es seguro, guardar automáticamente
        if (data.seguro) {
          await guardarAlimento(data);
        }
      } else {
        setError(data.error || "Error al verificar");
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setCargando(false);
    }
  };

  const guardarAlimento = async (data) => {
    try {
      await fetch("http://localhost:3000/guardar-alimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuario,
          alimento,
          seguro: data.seguro,
          mensaje: data.mensaje,
        }),
      });
      setGuardado(true);
    } catch {
      setError("No se pudo guardar el alimento");
    }
  };

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>🔒</span>
            <span style={styles.logoText}>fatsecret</span>
          </div>
          <div style={styles.headerDerecha}>
            <span style={styles.bienvenida}>Hola, {usuario} 👋</span>
            <span style={styles.cerrarSesion} onClick={cerrarSesion}>Cerrar sesión</span>
          </div>
        </div>

        <div style={styles.divider} />

        <div style={styles.body}>
          <p style={styles.descripcion}>
            Ingresa un alimento para verificar si es compatible con tus restricciones.
          </p>

          <div style={styles.campo}>
            <label style={styles.label}>Alimento a verificar:</label>
            <input
              type="text"
              value={alimento}
              onChange={e => { setAlimento(e.target.value); setResultado(null); setGuardado(false); }}
              placeholder="Ej: leche, pistachos, pan"
              style={styles.input}
              onKeyDown={e => e.key === "Enter" && verificar()}
            />
          </div>

          {error && <p style={styles.errorMsg}>{error}</p>}

          <button style={styles.btnPrimary} onClick={verificar} disabled={cargando}>
            {cargando ? "Verificando..." : "Agregar alimento"}
          </button>

          {/* Resultado seguro */}
          {resultado && resultado.seguro && (
            <div style={{ ...styles.resultado, backgroundColor: "#e8f5f2", borderColor: teal }}>
              <p style={{ ...styles.resultadoTexto, color: teal }}>
                {resultado.mensaje}
              </p>
              {guardado && <p style={styles.guardadoTexto}>✓ Guardado en tu historial</p>}
            </div>
          )}

          {/* Resultado no seguro — con botones */}
          {resultado && !resultado.seguro && !guardado && (
            <div style={{ ...styles.resultado, backgroundColor: "#fff3e0", borderColor: "#f5a623" }}>
              <p style={{ ...styles.resultadoTexto, color: "#e07b00" }}>
                {resultado.mensaje}
              </p>
              <p style={styles.pregunta}>¿Deseas agregarlo de todas formas?</p>
              <div style={styles.botones}>
                <button
                  style={styles.btnCancelar}
                  onClick={() => { setResultado(null); setAlimento(""); }}
                >
                  Cancelar
                </button>
                <button
                  style={styles.btnConfirmar}
                  onClick={() => guardarAlimento(resultado)}
                >
                  Confirmar igual
                </button>
              </div>
            </div>
          )}

          {/* Confirmado */}
          {resultado && !resultado.seguro && guardado && (
            <div style={{ ...styles.resultado, backgroundColor: "#f5f5f5", borderColor: "#ccc" }}>
              <p style={{ ...styles.resultadoTexto, color: "#666" }}>
                ⚠️ Alimento agregado con advertencia. Guardado en tu historial.
              </p>
            </div>
          )}

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
    borderRadius: 4, width: "100%", maxWidth: 500,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px" },
  logo: { display: "flex", alignItems: "center", gap: 8 },
  logoIcon: { fontSize: 22 },
  logoText: { color: teal, fontSize: 22, fontWeight: "bold", fontStyle: "italic" },
  headerDerecha: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 },
  bienvenida: { color: "#555", fontSize: 13 },
  cerrarSesion: { color: teal, fontSize: 12, cursor: "pointer", textDecoration: "underline" },
  divider: { height: 1, backgroundColor: "#e0e0e0" },
  body: { padding: "24px 32px 32px" },
  descripcion: { color: "#666", fontSize: 13, marginBottom: 20 },
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
  resultado: {
    marginTop: 20, padding: "14px 16px",
    borderRadius: 6, border: "1px solid",
  },
  resultadoTexto: { margin: 0, fontSize: 14, fontWeight: "500" },
  guardadoTexto: { margin: "8px 0 0", fontSize: 12, color: teal },
  pregunta: { fontSize: 13, color: "#666", margin: "10px 0 8px" },
  botones: { display: "flex", gap: 10, marginTop: 4 },
  btnCancelar: {
    flex: 1, padding: "7px", backgroundColor: "#fff",
    border: "1px solid #ccc", borderRadius: 3,
    fontSize: 13, cursor: "pointer", color: "#666",
  },
  btnConfirmar: {
    flex: 1, padding: "7px", backgroundColor: "#f5a623",
    border: "none", borderRadius: 3,
    fontSize: 13, cursor: "pointer", color: "#fff", fontWeight: "bold",
  },
};