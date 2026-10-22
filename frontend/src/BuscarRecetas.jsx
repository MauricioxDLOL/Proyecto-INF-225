import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AgregarRecetaIngesta from "./AgregarRecetaIngesta";
import "./BuscarRecetas.css";

function BuscarRecetas() {
  const navigate = useNavigate();

  const [recetas, setRecetas] = useState([]);
  
  const [busqueda, setBusqueda] = useState("");
  const [restriccion, setRestriccion] = useState("");
  const [caloriasMax, setCaloriasMax] = useState("");
  
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarRecetas = async () => {
    setCargando(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (busqueda.trim()) params.append("nombre", busqueda.trim());
      if (restriccion) params.append("restriccion", restriccion);
      if (caloriasMax) params.append("calorias_max", caloriasMax);

      const respuesta = await fetch(`http://localhost:3000/recetas?${params.toString()}`);

      if (!respuesta.ok) {
        throw new Error("Error al cargar recetas");
      }

      const data = await respuesta.json();
      setRecetas(data);
    } catch (err) {
      setError("No se pudieron cargar las recetas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRecetas();
  }, []);

  return (
    <section className="buscar-recetas">
      <div className="buscar-recetas-header">
        <h2>Recetas de la comunidad</h2>
        <p>Busca recetas creadas por otros usuarios y agrégalas a tu ingesta diaria.</p>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
        <input
          className="buscar-recetas-input"
          style={{ flex: "1", margin: "0" }}
          type="search"
          placeholder="Nombre de la receta..."
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
        
        <select 
          className="buscar-recetas-input" 
          style={{ flex: "1", margin: "0" }}
          value={restriccion} 
          onChange={e => setRestriccion(e.target.value)}
        >
          <option value="">Cualquier dieta / Sin restricciones</option>
          <option value="vegano">Vegano</option>
          <option value="vegetariano">Vegetariano</option>
          <option value="Gluten">Sin Gluten</option>
          <option value="Lactosa">Sin Lactosa</option>
          <option value="keto">Keto</option>
        </select>

        <input
          className="buscar-recetas-input"
          style={{ flex: "1", margin: "0" }}
          type="number"
          placeholder="Max. Calorías (ej: 500)"
          value={caloriasMax}
          onChange={e => setCaloriasMax(e.target.value)}
        />

        <button 
          onClick={cargarRecetas}
          style={{
            background: "#2db84d", color: "white", border: "none", 
            padding: "0 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
          }}
        >
          Filtrar
        </button>
      </div>

      <h3>Resultados</h3>

      {cargando && <p>Cargando recetas...</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && recetas.length === 0 && (
        <p>No se encontraron recetas con estos filtros.</p>
      )}

      <div className="buscar-recetas-lista">
        {recetas.map(receta => (
          <div className="buscar-recetas-item" key={receta.id}>
            <div className="buscar-recetas-info">
              <h4>{receta.nombre}</h4>
              <p>Por {receta.autor}</p>
              <span>{Math.round(Number(receta.calorias) / Number(receta.porciones))} kcal por porción</span>
            </div>

            <div className="buscar-recetas-acciones">
              <button
                className="buscar-recetas-ver"
                onClick={() => navigate(`/recetario/${receta.id}`)}
              >
                Ver receta
              </button>
              <button
                className="buscar-recetas-agregar"
                onClick={() => setRecetaSeleccionada(receta)}
              >
                + Añadir
              </button>
            </div>
          </div>
        ))}
      </div>

      {recetaSeleccionada && (
        <AgregarRecetaIngesta
          receta={recetaSeleccionada}
          onCerrar={() => setRecetaSeleccionada(null)}
        />
      )}
    </section>
  );
}

export default BuscarRecetas;