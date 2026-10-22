
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CrearReceta.css";

const API = "http://localhost:3000";

function CrearReceta() {
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [instrucciones, setInstrucciones] = useState("");
  const [porciones, setPorciones] = useState(1);
  const [restricciones, setRestricciones] = useState([]);
  const [otraRestriccion, setOtraRestriccion] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [mensajePublicacion, setMensajePublicacion] = useState("");
  


const cambiarRestriccion = (restriccion) => {
  setRestricciones(actuales =>
    actuales.includes(restriccion)
      ? actuales.filter(r => r !== restriccion)
      : [...actuales, restriccion]
  );
};

const publicarReceta = async () => {
    setMensajePublicacion("");

    if (!nombre.trim() || !instrucciones.trim()) {
        setMensajePublicacion(
        "Debes ingresar un nombre y las instrucciones."
        );
        return;
    }

    if (
        !Number.isInteger(Number(porciones)) ||
        Number(porciones) < 1
    ) {
        setMensajePublicacion(
        "El número de porciones debe ser un entero positivo."
        );
        return;
    }

    if (
        ingredientes.length === 0 ||
        ingredientes.some(i => Number(i.cantidad) <= 0)
    ) {
        setMensajePublicacion(
        "Debes agregar ingredientes con cantidades válidas."
        );
        return;
    }

    // El login de FastSecret devuelve { id, nombre }.
    // Comprobamos el usuario guardado en localStorage.
    let usuarioGuardado;
    try {
        usuarioGuardado = JSON.parse(localStorage.getItem("usuario"));
    } catch {
        usuarioGuardado = localStorage.getItem("usuario");
    }

    const usuario =
        typeof usuarioGuardado === "string"
        ? usuarioGuardado
        : usuarioGuardado?.nombre;

    if (!usuario) {
        setMensajePublicacion(
        "Debes iniciar sesión para publicar una receta."
        );
        return;
    }

    setPublicando(true);

    try {
        const respuesta = await fetch(`${API}/recetas`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            usuario,
            nombre,
            descripcion,
            instrucciones,
            porciones: Number(porciones),
            ingredientes,
            restricciones_compatibles: [
                ...restricciones,
                ...(otraRestriccion.trim()
                ? [otraRestriccion.trim()]
                : [])
            ]
        })
        });

        const data = await respuesta.json();

        if (!respuesta.ok) {
        throw new Error(data.error || "Error al publicar la receta");
        }

        alert("¡Receta publicada correctamente!");
        navigate("/recetario");

    } catch (error) {
        console.error(error);
        setMensajePublicacion(error.message);
    } finally {
        setPublicando(false);
    }
    };


  const buscarIngredientes = async () => {
    if (!busqueda.trim()) return;

    setCargando(true);
    setError("");
    setResultados([]);

    try {
      const respuesta = await fetch(
        `${API}/buscar-alimentos?query=${encodeURIComponent(busqueda)}`
      );

      if (!respuesta.ok) throw new Error("Error buscando ingredientes");

      const data = await respuesta.json();
      if (!Array.isArray(data.results)) {
        throw new Error("Respuesta inválida de Spoonacular");
      }

      setResultados(data.results);
    } catch (err) {
      setError("No se pudieron buscar los ingredientes.");
    } finally {
      setCargando(false);
    }
  };

  const agregarIngrediente = async (item) => {
    if (ingredientes.some(i => i.id === item.id)) {
      setError("Ese ingrediente ya está agregado.");
      return;
    }

    setCargando(true);
    setError("");

    try {
      const respuesta = await fetch(
        `${API}/informacion-alimento?id=${item.id}`
      );

      if (!respuesta.ok) throw new Error("Error obteniendo nutrientes");

      const data = await respuesta.json();

      if (!data.nutrientes) {
        throw new Error("No hay información nutricional");
      }

      setIngredientes(actuales => [
        ...actuales,
        {
          id: item.id,
          nombre: data.name,
          cantidad: 100,
          nutrientes: data.nutrientes
        }
      ]);

      setResultados([]);
      setBusqueda("");
    } catch (err) {
      setError("No se pudo obtener la información del ingrediente.");
    } finally {
      setCargando(false);
    }
  };

  const cambiarCantidad = (id, cantidad) => {
    setIngredientes(actuales =>
      actuales.map(item =>
        item.id === id ? { ...item, cantidad } : item
      )
    );
  };

  const eliminarIngrediente = (id) => {
    setIngredientes(actuales =>
      actuales.filter(item => item.id !== id)
    );
  };

  // Los nutrientes recibidos corresponden a 100 gramos.
  const totales = ingredientes.reduce(
    (acumulado, ingrediente) => {
      const factor = Number(ingrediente.cantidad) / 100;

      for (const macro of Object.keys(acumulado)) {
        acumulado[macro] +=
          (Number(ingrediente.nutrientes[macro]) || 0) * factor;
      }

      return acumulado;
    },
    { calorias: 0, proteinas: 0, carbohidratos: 0, grasas: 0 }
  );

  const porcionesValidas = Number(porciones) > 0
    ? Number(porciones)
    : 1;

  const formato = (valor) => valor.toFixed(1);

  return (
    <div className="crear-receta-page">
      <div className="crear-receta-container">

        <div className="crear-receta-header">
          <h1>Crear nueva receta</h1>
          <button type="button" onClick={() => navigate("/recetario")}>
            Volver al recetario
          </button>
        </div>

        <section className="receta-seccion">
          <h2>Información general</h2>

          <label>Nombre de la receta</label>
          <input
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Pollo con arroz"
          />

          <label>Descripción</label>
          <textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Describe brevemente tu receta"
          />

          <label>Número de porciones</label>
          <input
            type="number"
            min="1"
            step="1"
            value={porciones}
            onChange={e => setPorciones(e.target.value)}
          />
        </section>

        <section className="receta-seccion">
          <h2>Ingredientes</h2>

          <div className="receta-buscador">
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar ingrediente..."
              onKeyDown={e => {
                if (e.key === "Enter") buscarIngredientes();
              }}
            />

            <button
              type="button"
              onClick={buscarIngredientes}
              disabled={cargando}
            >
              Buscar
            </button>
          </div>

          {error && <p className="receta-error">{error}</p>}
          {cargando && <p>Cargando...</p>}

          <div className="receta-resultados">
            {resultados.map(item => (
              <div key={item.id} className="receta-resultado">
                <span>{item.name}</span>
                <button
                  type="button"
                  disabled={cargando}
                  onClick={() => agregarIngrediente(item)}
                >
                  Agregar
                </button>
              </div>
            ))}
          </div>


            <section className="receta-seccion">
                <h2>Restricciones compatibles</h2>

                <p>
                    Selecciona las restricciones alimentarias
                    con las que es compatible tu receta.
                </p>

                  <div className="receta-restricciones">
                    {[
                      { etiqueta: "Sin Gluten", valor: "Gluten" },
                      { etiqueta: "Sin Lactosa", valor: "Lactosa" },
                      { etiqueta: "Vegano", valor: "vegano" },
                      { etiqueta: "Vegetariano", valor: "vegetariano" },
                      { etiqueta: "Keto", valor: "keto" }
                    ].map(({ etiqueta, valor }) => (
                    <label
                        key={valor}
                        className="receta-restriccion-opcion"
                    >
                        <input
                        type="checkbox"
                        checked={restricciones.includes(valor)}
                        onChange={() => cambiarRestriccion(valor)}
                        />
                        <span>{etiqueta}</span>
                    </label>
                    ))}
                  </div>

                <label htmlFor="otra-restriccion">
                    Otra restricción (opcional)
                </label>

                <input
                    id="otra-restriccion"
                    type="text"
                    maxLength={60}
                    placeholder="Ej: Sin frutos secos, sin huevo..."
                    value={otraRestriccion}
                    onChange={e => setOtraRestriccion(e.target.value)}
                />
            </section>


          <h3>Ingredientes agregados</h3>

          {ingredientes.length === 0 && (
            <p>Aún no has agregado ingredientes.</p>
          )}

          {ingredientes.map(item => (
            <div key={item.id} className="receta-ingrediente">
              <span>{item.nombre}</span>

              <input
                type="number"
                min="1"
                value={item.cantidad}
                onChange={e =>
                  cambiarCantidad(item.id, e.target.value)
                }
              />

              <span>g</span>

              <button
                type="button"
                onClick={() => eliminarIngrediente(item.id)}
              >
                Eliminar
              </button>
            </div>
          ))}
        </section>

        <section className="receta-seccion">
          <h2>Información nutricional estimada</h2>

          <div className="receta-macros">
            {[
              ["Calorías", "calorias", "kcal"],
              ["Proteínas", "proteinas", "g"],
              ["Carbohidratos", "carbohidratos", "g"],
              ["Grasas", "grasas", "g"]
            ].map(([titulo, clave, unidad]) => (
              <div className="receta-macro" key={clave}>
                <h3>{titulo}</h3>
                <strong>{formato(totales[clave])} {unidad}</strong>
                <small>
                  Por porción: {formato(totales[clave] / porcionesValidas)} {unidad}
                </small>
              </div>
            ))}
          </div>
        </section>

        <section className="receta-seccion">
          <h2>Preparación</h2>

          <textarea
            rows="7"
            value={instrucciones}
            onChange={e => setInstrucciones(e.target.value)}
            placeholder="Escribe los pasos para preparar la receta..."
          />
        </section>

        {mensajePublicacion && (
            <p className="receta-error">{mensajePublicacion}</p>
        )}

        <button
            className="receta-publicar"
            type="button"
            onClick={publicarReceta}
            disabled={publicando}
        >
            {publicando ? "Publicando..." : "Publicar receta"}
        </button>

      </div>
    </div>
  );
}

export default CrearReceta;
