import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Recetario.css";
import AgregarRecetaIngesta from "./AgregarRecetaIngesta";

function Recetario({ soloMias = false }) {
  const navigate = useNavigate();

  const [recetas, setRecetas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(null);
  const [compartiendoId, setCompartiendoId] = useState(null);
  const [recetaParaCompartir, setRecetaParaCompartir] = useState(null);
  const [comentarioCompartir, setComentarioCompartir] = useState("");
  

  useEffect(() => {
    const obtenerRecetas = async () => {
      try {
        const respuesta = await fetch(
          "http://localhost:3000/recetas"
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
        const respuesta = await fetch(
        "http://localhost:3000/compartir-receta",
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json"
            },
            body: JSON.stringify({
            usuario: usuario.nombre,
            receta_id: receta.id,
            comentario: comentarioCompartir.trim()
            })
        }
        
        );

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

    const recetasVisibles = soloMias
        ? recetas.filter(
            receta => receta.autor === usuarioSesion?.nombre
            )
        : recetas;

  return (
    <div className="recetario-page">
      <div className="recetario-container">

        <div className="recetario-header">
          <div>
            <h1>
            {soloMias ? "Mis recetas" : "Recetario de la comunidad"}
            </h1>
            <p>
            {soloMias
                ? "Aquí encontrarás todas las recetas que has publicado."
                : "Descubre y comparte recetas con otros usuarios."}
            </p>
          </div>

        <div className="recetario-acciones">
            <button
                onClick={() => navigate("/crear-receta")}
            >
                + Crear receta
            </button>

            <button
                className="recetario-mis-recetas"
                onClick={() =>
                    navigate(soloMias ? "/recetario" : "/mis-recetas")
                }
                >
                {soloMias ? "Volver al Recetario" : "Mis recetas"}
            </button>
            </div>
        </div>

        {cargando && <p>Cargando recetas...</p>}
        {error && <p className="receta-error">{error}</p>}

        {!cargando && !error && recetasVisibles.length === 0 && (
            <p className="recetario-vacio">
                {soloMias
                ? "Todavía no has publicado ninguna receta."
                : "Todavía no hay recetas publicadas."}
            </p>
        )}

        <div className="recetario-grid">
          {recetasVisibles.map(receta => (
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

              <p className="recetario-autor">
                Por {receta.autor}
              </p>

              <p>{receta.descripcion}</p>

              <div className="recetario-nutricion">
                <strong>
                  {Math.round(
                    Number(receta.calorias) / receta.porciones
                  )} kcal
                </strong>

                <span>
                  Proteínas: {
                    (Number(receta.proteinas) / receta.porciones)
                      .toFixed(1)
                  } g
                </span>

                <span>
                  Carbohidratos: {
                    (Number(receta.carbohidratos) / receta.porciones)
                      .toFixed(1)
                  } g
                </span>

                <span>
                  Grasas: {
                    (Number(receta.grasas) / receta.porciones)
                      .toFixed(1)
                  } g
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
                )} kcal por porción
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
                onChange={(e) =>
                setComentarioCompartir(e.target.value)
                }
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
                disabled={
                    !comentarioCompartir.trim() ||
                    compartiendoId !== null
                }
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
