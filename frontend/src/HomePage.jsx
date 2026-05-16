import { useNavigate } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  const navigate = useNavigate();

  const usuario = {
    nombre: "Nicolás",
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
  const porcentajeCalorias = Math.round(
    (usuario.caloriasConsumidas / usuario.metaCalorica) * 100
  );
  const porcentajeProteina = Math.round(
    (usuario.proteina / usuario.metaproteina) * 100
  );
  const porcentajeCarbohidratos = Math.round(
    (usuario.carbohidratos / usuario.metacarbohidratos) * 100
  );

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
    </div>
  );
}

export default HomePage;
