import { useState } from "react";
import "./BuscarAlimento.css";

function BuscarAlimento() {
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  const [detalleAlimento, setDetalleAlimento] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // 1. Buscar autocompletado en Spoonacular
  const buscarAlimentos = async () => {
    if (!busqueda.trim()) return;
    setCargando(true);
    setDetalleAlimento(null); 

    try {
      const respuesta = await fetch(
        `http://localhost:3000/buscar-alimentos?query=${busqueda}`
      );
      const data = await respuesta.json();
      console.log(data);
      setResultados(data.results || []);
    } catch (error) {
      console.error("Error buscando alimentos:", error);
      setResultados([]);
    }
    setCargando(false);
  };

  // 2. Obtener la información nutricional real
  const verDetalleNutricional = async (idAlimento) => {
    setCargandoDetalle(true);
    setDetalleAlimento(null);

    const usuarioSesion = JSON.parse(localStorage.getItem("usuario")) || { nombre: "testuser" };

    try {
      const respuesta = await fetch(
        `http://localhost:3000/informacion-alimento?id=${idAlimento}&usuario=${usuarioSesion.nombre}`
      );
      const data = await respuesta.json();
      setDetalleAlimento(data);
    } catch (error) {
      console.error("Error al obtener detalles:", error);
    }
    setCargandoDetalle(false);
  };

  // 3. Función Agregar al Diario (Corregida)
  const agregarAlDiario = async () => {
    console.log("📥 Entró a agregar-alimento-diario");
    
    const usuarioSesion =
      JSON.parse(localStorage.getItem("usuario")) || { nombre: "testuser" };

    const bodyData = {
      usuario: usuarioSesion.nombre,
      nombre: detalleAlimento?.name || "Alimento",
      calorias: detalleAlimento?.nutrientes?.calorias || 0,
      proteinas: detalleAlimento?.nutrientes?.proteinas || 0,
      carbohidratos: detalleAlimento?.nutrientes?.carbohidratos || 0,
      grasas: detalleAlimento?.nutrientes?.grasas || 0,
    };

    console.log("Datos enviados desde React:", bodyData);

    try {
      const respuesta = await fetch(
        "http://localhost:3000/agregar-alimento-diario",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bodyData),
        }
      );

      const data = await respuesta.json();
      alert(data.mensaje);

    } catch (error) {
      console.error("Error en el fetch de React:", error);
      alert("Error al agregar alimento");
    }
  };

  return (
    <div className="buscar-page">
      <main className="buscar-container">

        <section className="buscar-card">
          <h2>🍎 Buscador Avanzado de Alimentos</h2>
          <p>Consulta información nutricional en tiempo real cruzada con tus alertas de salud.</p>
          <div className="busqueda-container">
            <input
              type="text"
              placeholder="Buscar alimento en inglés (ej: milk, apple)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <button onClick={buscarAlimentos}>Buscar</button>
          </div>
        </section>

        {cargandoDetalle && (
          <p style={{ textAlign: 'center', margin: '20px', color: '#666' }}>
            ⏳ Analizando composición y alérgenos reales...
          </p>
        )}

        {detalleAlimento && (
          <section className="detalle-destacado" style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '25px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            marginTop: '20px',
            borderTop: `8px solid ${detalleAlimento?.seguro ? '#2ec4b6' : '#e71d36'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
              <h2>{(detalleAlimento?.name ? detalleAlimento.name : "Alimento").toUpperCase()}</h2>
              
              <span style={{
                padding: '8px 15px',
                borderRadius: '20px',
                fontWeight: 'bold',
                color: '#fff',
                backgroundColor: detalleAlimento?.seguro ? '#2ec4b6' : '#e71d36'
              }}>
                {detalleAlimento?.seguro ? "✓ Apto para ti" : "⚠️ Alérgeno Detectado"}
              </span>
            </div>

            <p style={{
              padding: '12px',
              borderRadius: '6px',
              marginTop: '10px',
              fontWeight: '500',
              backgroundColor: detalleAlimento?.seguro ? '#e6f7f4' : '#ffebee',
              color: detalleAlimento?.seguro ? '#0f766e' : '#c53030'
            }}>
              {detalleAlimento?.mensajeAlerta || "Información de alérgenos processed correctamente."}
            </p>

            <h4 style={{ marginTop: '20px', color: '#555' }}>Información Nutricional (Por cada 100g)</h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
              gap: '15px',
              marginTop: '12px'
            }}>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.5em' }}>🔥</span>
                <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.9em' }}>Calorías</p>
                <strong>{detalleAlimento?.nutrientes?.calorias || 0} kcal</strong>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.5em' }}>💪</span>
                <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.9em' }}>Proteínas</p>
                <strong>{detalleAlimento?.nutrientes?.proteinas || 0}g</strong>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.5em' }}>🍞</span>
                <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.9em' }}>Carbohidratos</p>
                <strong>{detalleAlimento?.nutrientes?.carbohidratos || 0}g</strong>
              </div>
              <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
                <span style={{ fontSize: '1.5em' }}>🥑</span>
                <p style={{ margin: '5px 0 0', color: '#666', fontSize: '0.9em' }}>Grasas</p>
                <strong>{detalleAlimento?.nutrientes?.grasas || 0}g</strong>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "25px" }}>
              <button
                onClick={agregarAlDiario}
                style={{
                  background: "#2db84d",
                  color: "white",
                  border: "none",
                  padding: "14px 30px",
                  borderRadius: "10px",
                  fontSize: "16px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                ➕ Agregar a mi diario
              </button>
            </div>

          </section>
        )}

        <section className="resultados-card" style={{ marginTop: '30px' }}>
          <h3>Resultados de Búsqueda</h3>
          {cargando && <p>🔎 Buscando alimentos...</p>}

          {!cargando && resultados.length === 0 ? (
            <div className="mensaje-vacio">🍏 Busca un ingrediente para desplegar la lista.</div>
          ) : (
            <div className="resultados-grid">
              {resultados.map((producto, indice) => (
                <div className="tarjeta-alimento" key={producto.id || indice}>
                  <img
                    src={
                      producto.image
                        ? `https://spoonacular.com/cdn/ingredients_100x100/${producto.image}`
                        : "https://via.placeholder.com/100"
                    }
                    alt={producto.name}
                  />
                  <h4>{producto.name}</h4>
                  <button onClick={() => producto.id ? verDetalleNutricional(producto.id) : alert("ID no disponible")}>
                    Ver información
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default BuscarAlimento;