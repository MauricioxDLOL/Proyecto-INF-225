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

  // RS004: Me gusta y comentarios
  const [likes, setLikes] = useState({ total: 0, meGusta: false });
  const [comentarios, setComentarios] = useState([]);
  const [textoComentario, setTextoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [errorSocial, setErrorSocial] = useState("");
  const [procesandoLike, setProcesandoLike] = useState(false);

  const obtenerUsuarioSesion = () => {
    try {
      return JSON.parse(localStorage.getItem("usuario"));
    } catch {
      return null;
    }
  };

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

  useEffect(() => {
    const cargarInteraccion = async () => {
      const usuario = obtenerUsuarioSesion();
      const query = usuario?.nombre
        ? `?usuario=${encodeURIComponent(usuario.nombre)}`
        : "";

      try {
        const [respLikes, respComentarios] = await Promise.all([
          fetch(`http://localhost:3000/recetas/${id}/likes${query}`),
          fetch(`http://localhost:3000/recetas/${id}/comentarios`)
        ]);

        if (respLikes.ok) setLikes(await respLikes.json());
        if (respComentarios.ok) setComentarios(await respComentarios.json());
      } catch {
        setErrorSocial("No se pudo cargar la interacción social.");
      }
    };

    cargarInteraccion();
  }, [id]);

const alternarMeGusta = async () => {
  if (procesandoLike) return;

  const usuario = obtenerUsuarioSesion();
  setErrorSocial("");

  if (!usuario?.nombre) {
    setErrorSocial("Debes iniciar sesión para dar Me gusta.");
    return;
  }

  setProcesandoLike(true);
  try {
    const respuesta = await fetch(
      `http://localhost:3000/recetas/${id}/likes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario: usuario.nombre })
      }
    );
    const data = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(data.error || "Error al registrar el Me gusta.");
    }
    setLikes(data);
  } catch (err) {
    setErrorSocial(err.message);
  } finally {
    setProcesandoLike(false);
  }
};
  const enviarComentario = async () => {
    const usuario = obtenerUsuarioSesion();
    setErrorSocial("");

    if (!usuario?.nombre) {
      setErrorSocial("Debes iniciar sesión para comentar.");
      return;
    }
    if (!textoComentario.trim()) {
      setErrorSocial("Escribe un comentario antes de enviarlo.");
      return;
    }

    setEnviandoComentario(true);
    try {
      const respuesta = await fetch(
        `http://localhost:3000/recetas/${id}/comentarios`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            usuario: usuario.nombre,
            texto: textoComentario
          })
        }
      );
      const data = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(data.error || "Error al agregar el comentario.");
      }

      setComentarios(prev => [data, ...prev]);
      setTextoComentario("");
    } catch (err) {
      setErrorSocial(err.message);
    } finally {
      setEnviandoComentario(false);
    }
  };

  const formatoFecha = (fecha) =>
    new Date(fecha).toLocaleString("es-CL", {
      dateStyle: "short",
      timeStyle: "short"
    });

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

        <div className="detalle-receta-card detalle-social">
          <button
            className={`detalle-megusta ${likes.meGusta ? "activo" : ""}`}
            onClick={alternarMeGusta}
            disabled={procesandoLike}
          >
            {likes.meGusta ? "♥" : "♡"} Me gusta
          </button>
          <span className="detalle-megusta-contador">
            {likes.total} {likes.total === 1 ? "persona" : "personas"}
          </span>
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

        <div className="detalle-receta-card">
          <h2>Comentarios ({comentarios.length})</h2>

          <div className="detalle-comentar">
            <textarea
              className="detalle-comentar-texto"
              placeholder="Escribe un comentario..."
              value={textoComentario}
              maxLength={1000}
              onChange={(e) => setTextoComentario(e.target.value)}
            />
            <button
              className="detalle-comentar-boton"
              onClick={enviarComentario}
              disabled={enviandoComentario}
            >
              {enviandoComentario ? "Enviando..." : "Comentar"}
            </button>
          </div>

          {errorSocial && <p className="detalle-social-error">{errorSocial}</p>}

          {comentarios.length === 0 ? (
            <p className="detalle-sin-comentarios">Aún no hay comentarios.</p>
          ) : (
            <div className="detalle-comentarios">
              {comentarios.map(c => (
                <div className="detalle-comentario" key={c.id}>
                  <div className="detalle-comentario-header">
                    <strong>{c.autor}</strong>
                    <span>{formatoFecha(c.fecha)}</span>
                  </div>
                  <p>{c.texto}</p>
                </div>
              ))}
            </div>
          )}
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