
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./DetalleReceta.css";
import AgregarRecetaIngesta from "./AgregarRecetaIngesta";

function DetalleReceta() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [receta, setReceta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mostrarIngesta, setMostrarIngesta] = useState(false);

  useEffect(() => {
    const obtenerReceta = async () => {
      setCargando(true);
      setError("");

      try {
        const respuesta = await fetch(
          `http://localhost:3000/recetas/${id}`
        );

        const data = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(data.error || "Error al obtener la receta.");
        }

        setReceta(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    };

    obtenerReceta();
  }, [id]);

  const formato = (valor) => Number(valor || 0).toFixed(1);

  if (cargando) {
    return <div className="detalle-receta-page">Cargando receta...</div>;

  }

  if (error || !receta) {
    return (
      <div className="detalle-receta-page">
        <p>{error || "Receta no encontrada."}</p>
        <button onClick={() => navigate("/recetario")}>
          Volver al recetario
        </button>
      </div>
    );
  }

  const porciones = Number(receta.porciones);

  return (
    <div className="detalle-receta-page">
      <div className="detalle-receta-container">

        <button
          className="detalle-volver"
          onClick={() => navigate("/recetario")}
        >
          ← Volver al recetario
        </button>

        <div className="detalle-receta-card">
          <h1>{receta.nombre}</h1>

          <p className="detalle-autor">
            Publicada por {receta.autor}
          </p>

          {receta.descripcion && (
            <p>{receta.descripcion}</p>
          )}

          <p>
            <strong>Porciones:</strong> {receta.porciones}
          </p>
        </div>

        <button
            className="receta-agregar-diario"
            onClick={() => setMostrarIngesta(true)}
        >
            + Añadir a mi ingesta diaria
        </button>


        <div className="detalle-receta-card">
            <h2>Restricciones compatibles</h2>

            {receta.restricciones_compatibles?.length > 0 ? (
                <div className="detalle-restricciones">
                {receta.restricciones_compatibles.map((restriccion, index) => (
                    <span
                    key={index}
                    className="detalle-restriccion"
                    >
                    {restriccion}
                    </span>
                ))}
                </div>
            ) : (
                <p>No se han declarado restricciones compatibles.</p>
            )}
        </div>


        <div className="detalle-receta-card">
          <h2>Información nutricional</h2>
          <p>Valores estimados por porción</p>

          <div className="detalle-macros">
            {[
              ["Calorías", "calorias", "kcal"],
              ["Proteínas", "proteinas", "g"],
              ["Carbohidratos", "carbohidratos", "g"],
              ["Grasas", "grasas", "g"]
            ].map(([titulo, clave, unidad]) => (
              <div className="detalle-macro" key={clave}>
                <span>{titulo}</span>
                <strong>
                  {formato(Number(receta[clave]) / porciones)} {unidad}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="detalle-receta-card">
          <h2>Ingredientes</h2>

          <div className="detalle-ingredientes">
            {receta.ingredientes.map(ingrediente => (
              <div
                className="detalle-ingrediente"
                key={ingrediente.id}
              >
                <span>{ingrediente.nombre}</span>
                <strong>
                  {formato(ingrediente.cantidad)} {ingrediente.unidad}
                </strong>
              </div>
            ))}
          </div>
        </div>

        <div className="detalle-receta-card">
          <h2>Preparación</h2>

          <p className="detalle-instrucciones">
            {receta.instrucciones}
          </p>
        </div>

      </div>
      {mostrarIngesta && (
        <AgregarRecetaIngesta
            receta={receta}
            onCerrar={() => setMostrarIngesta(false)}
        />
        )}
    </div>
  );
}

export default DetalleReceta;
