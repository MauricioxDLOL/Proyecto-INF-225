
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AgregarRecetaIngesta from "./AgregarRecetaIngesta";
import "./BuscarRecetas.css";

function BuscarRecetas() {
  const navigate = useNavigate();

  const [recetas, setRecetas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarRecetas = async () => {
      try {
        const respuesta = await fetch(
          "http://localhost:3000/recetas"
        );

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

    cargarRecetas();
  }, []);

  const texto = busqueda.trim().toLowerCase();

  const recetasVisibles = texto
    ? recetas.filter(receta =>
        receta.nombre.toLowerCase().includes(texto)
      )
    : recetas.slice(0, 5);

  return (
    <section className="buscar-recetas">
      <div className="buscar-recetas-header">
        <h2>📖 Recetas de la comunidad</h2>
        <p>
          Busca recetas creadas por otros usuarios
          y agrégalas a tu ingesta diaria.
        </p>
      </div>

      <input
        className="buscar-recetas-input"
        type="search"
        placeholder="Buscar recetas por nombre..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
      />

      <h3>
        {texto
          ? "Resultados de búsqueda"
          : "Últimas 5 recetas publicadas"}
      </h3>

      {cargando && <p>Cargando recetas...</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && recetasVisibles.length === 0 && (
        <p>No se encontraron recetas.</p>
      )}

      <div className="buscar-recetas-lista">
        {recetasVisibles.map(receta => (
          <div className="buscar-recetas-item" key={receta.id}>
            <div className="buscar-recetas-info">
              <h4>{receta.nombre}</h4>

              <p>Por {receta.autor}</p>

              <span>
                {Math.round(
                  Number(receta.calorias) /
                  Number(receta.porciones)
                )} kcal por porción
              </span>
            </div>

            <div className="buscar-recetas-acciones">
              <button
                className="buscar-recetas-ver"
                onClick={() =>
                  navigate(`/recetario/${receta.id}`)
                }
              >
                Ver receta
              </button>

              <button
                className="buscar-recetas-agregar"
                onClick={() =>
                  setRecetaSeleccionada(receta)
                }
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
