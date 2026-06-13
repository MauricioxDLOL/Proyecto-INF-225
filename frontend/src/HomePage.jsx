import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [tipoActividad, setTipoActividad] = useState("");
  const [intensidad, setIntensidad] = useState("baja");
  const [duracion, setDuracion] = useState("");
  const [error, setError] = useState("");
  const [caloriasQuemadas, setCaloriasQuemadas] = useState(null);

  let usuarioLocal = null;
  try {
    const storedUser = localStorage.getItem('usuario');
    if (storedUser) {
      usuarioLocal = JSON.parse(storedUser);
    }
  } catch (error) {
    localStorage.removeItem('usuario'); 
  }

  const usuario = {
    id: usuarioLocal?.id || null,
    nombre: usuarioLocal?.nombre || "Invitado",
    peso: 75,
    caloriasConsumidas: 324,
    metaCalorica: 2000,
    proteina: 32,
    metaproteina: 150,
    carbohidratos: 28,
    metacarbohidratos: 250,
    grasa: 8,
    racha: 7,
  };

  const caloriasRestantes = usuario.metaCalorica - usuario.caloriasConsumidas;
  const porcentajeCalorias = Math.round((usuario.caloriasConsumidas / usuario.metaCalorica) * 100);
  const porcentajeProteina = Math.round((usuario.proteina / usuario.metaproteina) * 100);
  const porcentajeCarbohidratos = Math.round((usuario.carbohidratos / usuario.metacarbohidratos) * 100);

  const handleGuardarActividad = async (e) => {
    e.preventDefault();
    setError("");
    setCaloriasQuemadas(null);

    if (!usuario.id) {
      setError("Debes iniciar sesión para registrar una actividad.");
      return;
    }

    if (!tipoActividad || !duracion) {
      setError("Los campos Tipo de actividad y Duración son obligatorios.");
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/actividades', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: usuario.id,
          tipo_actividad: tipoActividad,
          intensidad: intensidad,
          duracion_minutos: parseInt(duracion, 10)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al procesar la solicitud");
      }

      setCaloriasQuemadas(data.calorias_quemadas);

      setTipoActividad("");
      setDuracion("");
      setIntensidad("baja");

    } catch (err) {
      setError(err.message);
    }
  };

  const cerrarPopup = () => {
    setIsPopupOpen(false);
    setError("");
    setCaloriasQuemadas(null);
    setTipoActividad("");
    setDuracion("");
    setIntensidad("baja");
  };

  return (
    <div className="home-page">
      <header className="home-header">
        <div className="top-bar">
          <h1>Fatsecret</h1>

          <div className="search-bar">
            <input type="text" placeholder="Buscar alimentos..." />
            <button>🔍</button>
          </div>

          <nav className="user-nav">
            <button onClick={() => navigate("/login")}>Iniciar sesión</button>
            <button onClick={() => navigate("/registro")}>Registrarse</button>
          </nav>
        </div>

        <div className="main-nav">
          <button onClick={() => navigate("/comunidad")}>Comunidad</button>
          <button onClick={() => navigate("/agregar")}>Alimentos</button>
          <button onClick={() => navigate("/metas")}>Metas</button>
          <button onClick={() => navigate("/perfil")}>Perfil</button>
          <button onClick={() => setIsPopupOpen(true)}>Actividad</button>
        </div>
      </header>

      <main className="home-container">
        <section className="welcome-card">
          <h2>Hola, {usuario.nombre}</h2>
          <p>Resumen de tu alimentación de hoy</p>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <h3>Peso actual</h3>
            <p>{usuario.peso} kg</p>
          </div>
          <div className="summary-card">
            <h3>Calorías consumidas</h3>
            <p>{usuario.caloriasConsumidas} kcal</p>
          </div>
          <div className="summary-card">
            <h3>Calorías restantes</h3>
            <p>{caloriasRestantes} kcal</p>
          </div>
          <div className="summary-card">
            <h3>Racha actual</h3>
            <p>{usuario.racha} días</p>
          </div>
        </section>

        <section className="progress-card">
          <h2>Progreso diario</h2>
          <div className="chart-container">
            <div className="chart-item">
              <div className="progress-circle">
                <span>{porcentajeCalorias}%</span>
              </div>
              <p>Calorías consumidas: {usuario.caloriasConsumidas}</p>
            </div>
            <div className="chart-item">
              <div className="progress-circle">
                <span>{porcentajeProteina}%</span>
              </div>
              <p>Proteínas consumidas: {usuario.proteina}</p>
            </div>
            <div className="chart-item">
              <div className="progress-circle">
                <span>{porcentajeCarbohidratos}%</span>
              </div>
              <p>Carbohidratos consumidos: {usuario.carbohidratos}</p>
            </div>
          </div>

          <p>
            Has consumido {usuario.caloriasConsumidas} de {usuario.metaCalorica} kcal.
          </p>

          <div className="macros">
            <span>Proteína: {usuario.proteina} g</span>
            <span>Carbohidratos: {usuario.carbohidratos} g</span>
            <span>Grasa: {usuario.grasa} g</span>
          </div>
        </section>

        <section className="achievements-card">
          <h2>Logros:</h2>
          <div className="achievements-list">
            {caloriasRestantes <= 0 && (
              <div className="achievement-item">
                <p>Has alcanzado tu meta de calorías hoy.</p>
              </div>
            )}
            {usuario.racha > 0 && (
              <div className="achievement-item">
                <p>Has mantenido tu racha de {usuario.racha} días.</p>
              </div>
            )}
          </div>
        </section>

        <section className="actions-grid">
          <button>Quiénes somos</button>
        </section>
      </main>
      {isPopupOpen && (
        <div className="popup-overlay">
          <div className="popup-content">
            <h2>Registrar Actividad Física</h2>
            <button className="close-btn" onClick={cerrarPopup}>X</button>

            <form onSubmit={handleGuardarActividad} className="actividad-form">
              <div className="form-group">
                <label>Tipo de Actividad *</label>
                <input 
                  type="text"
                  value={tipoActividad}
                  onChange={(e) => setTipoActividad(e.target.value)}
                  placeholder="Ej. Correr, Ciclismo, Pesas"
                />
              </div>

              <div className="form-group">
                <label>Intensidad</label>
                <select value={intensidad} onChange={(e) => setIntensidad(e.target.value)}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </div>

              <div className="form-group">
                <label>Duración (minutos) *</label>
                <input
                  type="number"
                  min="1"
                  value={duracion}
                  onChange={(e) => setDuracion(e.target.value)}
                  placeholder="Ej. 30"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              {caloriasQuemadas !== null && (
                <div className="success-message">
                  ¡Registro exitoso! Has quemado <strong>{caloriasQuemadas} calorías</strong>.
                </div>
              )}

              <button type="submit" className="submit-btn">Guardar Actividad</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
