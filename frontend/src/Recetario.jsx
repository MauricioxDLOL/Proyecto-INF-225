import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Recetario.css";
import AgregarRecetaIngesta from "./AgregarRecetaIngesta";

function Recetario({ soloMias = false }) {
  const navigate = useNavigate();

  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [restriccion, setRestriccion] = useState("");
  const [caloriasMax, setCaloriasMax] = useState("");

  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [compartiendoId, setCompartiendoId] = useState(null);
  const [recetaParaCompartir, setRecetaParaCompartir] = useState(null);
  const [comentarioCompartir, setComentarioCompartir] = useState("");

  const obtenerRecetas = async () => {
    setCargando(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (busqueda.trim()) params.append("nombre", busqueda.trim());
      if (restriccion) params.append("restriccion", restriccion);
      if (caloriasMax) params.append("calorias_max", caloriasMax);

      const respuesta = await fetch(
        `http://localhost:3000/recetas?${params.toString()}`
      );

      if (!respuesta.ok) {
        throw new Error("Error obteniendo recetas");
      }

      const data = await respuesta.json();
      setRecetas(data);
    } catch (err) {
      setError("No se pudieron cargar las recetas.");
    } finally {
      setCargando(false);
    }
  };

  const limpiarFiltros = async () => {
    setBusqueda("");
    setRestriccion("");
    setCaloriasMax("");
    setCargando(true);
    setError("");
    try {
      const respuesta = await fetch("http://localhost:3000/recetas");
      if (!respuesta.ok) throw new Error("Error obteniendo recetas");
      const data = await respuesta.json();
      setRecetas(data);
    } catch (err) {
      setError("No se pudieron cargar las recetas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    obtenerRecetas();
  }, []);

  const compartirReceta = async () => {
    const receta = recetaParaCompartir;

    if (!receta || !comentarioCompartir.trim()) {
      alert("Escribe un comentario antes de compartir.");
      return;
    }
    let usuario;

    try {
      usuario = JSON.parse(localStorage.getItem("usuario"));
    } catch {
      usuario = null;
    }

    if (!usuario?.nombre) {
      alert("Debes iniciar sesión para compartir recetas.");
      return;
    }

    setCompartiendoId(receta.id);

    try {
      const respuesta = await fetch("http://localhost:3000/compartir-receta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: usuario.nombre,
          receta_id: receta.id,
          comentario: comentarioCompartir.trim(),
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "Error al compartir.");
      }

      alert("¡Receta compartida en Comunidad!");
      setRecetaParaCompartir(null);
      setComentarioCompartir("");
    } catch (error) {
      alert(error.message);
    } finally {
      setCompartiendoId(null);
    }
  };

  const usuarioSesion = (() => {
    try {
      return JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return null;
    }
  })();

  // Si estamos en la vista "Mis recetas", filtramos localmente las que coincidan con el usuario
  const recetasVisibles = soloMias
    ? recetas.filter((receta) => receta.autor === usuarioSesion?.nombre)
    : recetas;

  return (
    <div className="recetario-page">
      <div className="recetario-container">
        <div className="recetario-header">
          <div>
            <h1>{soloMias ? "Mis recetas" : "Recetario de la comunidad"}</h1>
            <p>
              {soloMias
                ? "Aquí encontrarás todas las recetas que has publicado."
                : "Descubre y comparte recetas con otros usuarios."}
            </p>
          </div>

          <div className="recetario-acciones">
            <button onClick={() => navigate("/crear-receta")}>
              + Crear receta
            </button>

            <button
              className="recetario-mis-recetas"
              onClick={() => navigate(soloMias ? "/recetario" : "/mis-recetas")}
            >
              {soloMias ? "Volver al Recetario" : "Mis recetas"}
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "30px", marginTop: "10px" }}>
          <input
            type="search"
            placeholder="Nombre de la receta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{ flex: "1", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "15px" }}
          />
          
          <select 
            value={restriccion} 
            onChange={(e) => setRestriccion(e.target.value)}
            style={{ flex: "1", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "15px" }}
          >
            <option value="">Cualquier dieta / Sin restricciones</option>
            <option value="vegano">Vegano</option>
            <option value="vegetariano">Vegetariano</option>
            <option value="Gluten">Sin Gluten</option>
            <option value="Lactosa">Sin Lactosa</option>
            <option value="keto">Keto</option>
          </select>

          <input
            type="number"
            placeholder="Max. Calorías (ej: 500)"
            value={caloriasMax}
            onChange={(e) => setCaloriasMax(e.target.value)}
            style={{ flex: "1", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "15px" }}
          />

          <button 
            onClick={obtenerRecetas}
            style={{
              background: "#2db84d", color: "white", border: "none", 
              padding: "0 25px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px"
            }}
          >
            Filtrar
          </button>

          <button 
            onClick={limpiarFiltros}
            style={{
              background: "#f0f0f0", color: "#555", border: "1px solid #ccc", 
              padding: "0 20px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "15px"
            }}
          >
            Limpiar filtros
          </button>
        </div>

        {cargando && <p>Cargando recetas...</p>}
        {error && <p className="receta-error">{error}</p>}

        {!cargando && !error && recetasVisibles.length === 0 && (
          <p className="recetario-vacio">
            {soloMias
              ? "Todavía no has publicado ninguna receta que coincida con la búsqueda."
              : "No se encontraron recetas con estos filtros."}
          </p>
        )}

        <div className="recetario-grid">
          {recetasVisibles.map((receta) => (
            <div
              className="recetario-card"
              key={receta.id}
              role="link"
              tabIndex={0}
              onClick={() => navigate(`/recetario/${receta.id}`)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/recetario/${receta.id}`);
                }
              }}
            >
              <h2>{receta.nombre}</h2>

              <p className="recetario-autor">Por {receta.autor}</p>

              <p>{receta.descripcion}</p>

              <div className="recetario-nutricion">
                <strong>
                  {Math.round(Number(receta.calorias) / receta.porciones)} kcal
                </strong>

                <span>
                  Proteínas:{" "}
                  {(Number(receta.proteinas) / receta.porciones).toFixed(1)} g
                </span>

                <span>
                  Carbohidratos:{" "}
                  {(Number(receta.carbohidratos) / receta.porciones).toFixed(1)} g
                </span>

                <span>
                  Grasas:{" "}
                  {(Number(receta.grasas) / receta.porciones).toFixed(1)} g
                </span>
              </div>

              <p className="recetario-porciones">
                {receta.porciones} porciones
              </p>

              <button
                className="recetario-agregar"
                onClick={(e) => {
                  e.stopPropagation();
                  setRecetaSeleccionada(receta);
                }}
              >
                + Añadir a mi ingesta
              </button>
              <button
                className="recetario-compartir"
                disabled={compartiendoId === receta.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setComentarioCompartir("");
                  setRecetaParaCompartir(receta);
                }}
              >
                <span aria-hidden="true">🔁</span>{" "}
                {compartiendoId === receta.id
                  ? "Compartiendo..."
                  : "Compartir en Comunidad"}
              </button>
            </div>
          ))}
        </div>

        {recetaSeleccionada && (
          <AgregarRecetaIngesta
            receta={recetaSeleccionada}
            onCerrar={() => setRecetaSeleccionada(null)}
          />
        )}

        {recetaParaCompartir && (
          <div
            className="recetario-compartir-overlay"
            onClick={() => setRecetaParaCompartir(null)}
          >
            <div
              className="recetario-compartir-modal"
              role="dialog"
              aria-modal="true"
              aria-label="Compartir receta"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Compartir en Comunidad</h2>

              <div className="recetario-compartir-preview">
                <strong>{recetaParaCompartir.nombre}</strong>

                <p>
                  {Math.round(
                    Number(recetaParaCompartir.calorias) /
                      Number(recetaParaCompartir.porciones)
                  )}{" "}
                  kcal por porción
                </p>
              </div>

              <label htmlFor="comentario-compartir">
                ¿Qué quieres comentar sobre esta receta?
              </label>

              <textarea
                id="comentario-compartir"
                placeholder="Escribe tu comentario..."
                value={comentarioCompartir}
                maxLength={1000}
                onChange={(e) => setComentarioCompartir(e.target.value)}
                rows={4}
              />

              <div className="recetario-compartir-botones">
                <button
                  type="button"
                  onClick={() => setRecetaParaCompartir(null)}
                  disabled={compartiendoId !== null}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={compartirReceta}
                  disabled={!comentarioCompartir.trim() || compartiendoId !== null}
                >
                  {compartiendoId !== null
                    ? "Publicando..."
                    : "Compartir receta"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Recetario;