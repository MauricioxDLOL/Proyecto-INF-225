
import React, { useState } from "react";
import "./AgregarRecetaIngesta.css";

function AgregarRecetaIngesta({ receta, onCerrar }) {
  const [porciones, setPorciones] = useState("1");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const cantidad = Number(porciones);
  const cantidadValida =
    Number.isFinite(cantidad) && cantidad > 0;

  const factor = cantidadValida
    ? cantidad / Number(receta.porciones)
    : 0;

  const macros = {
    calorias: Number(receta.calorias) * factor,
    proteinas: Number(receta.proteinas) * factor,
    carbohidratos: Number(receta.carbohidratos) * factor,
    grasas: Number(receta.grasas) * factor
  };

  const agregarAlDiario = async () => {
    setError("");

    if (!cantidadValida) {
      setError("Ingresa una cantidad válida de porciones.");
      return;
    }

    let usuario;

    try {
      usuario = JSON.parse(localStorage.getItem("usuario"));
    } catch {
      usuario = null;
    }

    if (!usuario?.id) {
      setError("Debes iniciar sesión para registrar una receta.");
      return;
    }

    setGuardando(true);

    try {
      const respuesta = await fetch(
        "http://localhost:3000/agregar-receta-diario",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            usuario_id: usuario.id,
            receta_id: receta.id,
            porciones: cantidad
          })
        }
      );

      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          data.error || "No se pudo registrar la receta."
        );
      }

      alert(data.mensaje);
      onCerrar();

    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="agregar-receta-overlay"
      onClick={onCerrar}
    >
      <div
        className="agregar-receta-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Añadir receta a mi ingesta"
        onClick={e => e.stopPropagation()}
      >
        <div className="agregar-receta-encabezado">
          <h2>Añadir a mi ingesta</h2>
          <button onClick={onCerrar} type="button">
            ✕
          </button>
        </div>

        <h3>{receta.nombre}</h3>

        <p>
          Esta receta rinde {receta.porciones} porciones.
        </p>

        <label htmlFor="porciones-consumidas">
          ¿Cuántas porciones consumiste?
        </label>

        <input
          id="porciones-consumidas"
          type="number"
          min="0.1"
          step="0.5"
          value={porciones}
          onChange={e => setPorciones(e.target.value)}
        />

        <div className="agregar-receta-macros">
          <div>
            <strong>{macros.calorias.toFixed(1)}</strong>
            <span>kcal</span>
          </div>

          <div>
            <strong>{macros.proteinas.toFixed(1)} g</strong>
            <span>Proteínas</span>
          </div>

          <div>
            <strong>{macros.carbohidratos.toFixed(1)} g</strong>
            <span>Carbohidratos</span>
          </div>

          <div>
            <strong>{macros.grasas.toFixed(1)} g</strong>
            <span>Grasas</span>
          </div>
        </div>

        {error && (
          <p className="agregar-receta-error">{error}</p>
        )}

        <button
          className="agregar-receta-confirmar"
          onClick={agregarAlDiario}
          disabled={guardando || !cantidadValida}
          type="button"
        >
          {guardando
            ? "Guardando..."
            : "Confirmar ingesta"}
        </button>
      </div>
    </div>
  );
}

export default AgregarRecetaIngesta;
