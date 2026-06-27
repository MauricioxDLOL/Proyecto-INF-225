import { useEffect, useState } from "react";
import "./SeguimientoPeso.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function SeguimientoPeso() {
  const [historial, setHistorial] = useState([]);
  const [nuevoPeso, setNuevoPeso] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  let usuarioLocal = null;
  let usuarioNombre = null;

  try {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      usuarioLocal = JSON.parse(storedUser);
      usuarioNombre = usuarioLocal.nombre || usuarioLocal.usuario;
    }
  } catch (err) {
    console.error(err);
  }

  const cargarHistorial = async () => {
    if (!usuarioNombre) return;

    try {
      const res = await fetch(`http://localhost:3000/peso/${usuarioNombre}`);
      const data = await res.json();
      setHistorial(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    cargarHistorial();
  }, []);

  const guardarPeso = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");

    if (!usuarioNombre) {
      setError("Debes iniciar sesión para registrar tu peso.");
      return;
    }

    if (!nuevoPeso) {
      setError("Debes ingresar un peso.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/peso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: usuarioNombre,
          peso: Number(nuevoPeso),
        }),
      });

      if (!res.ok) {
        throw new Error("No se pudo guardar el peso.");
      }

      setMensaje("Peso registrado correctamente.");
      setNuevoPeso("");
      cargarHistorial();
    } catch (err) {
      setError(err.message);
    }
  };

  const datosGrafico = historial.map((item) => ({
    fecha: new Date(item.fecha).toLocaleDateString(),
    peso: Number(item.peso)
    }));

  const pesoActual =
    historial.length > 0 ? historial[historial.length - 1].peso : "-";

  return (
    <div className="seguimiento-page">
      <div className="seguimiento-container">
        <h1>Seguimiento de peso</h1>

        <section className="peso-card">
          <h2>Peso actual</h2>
          <p className="peso-actual">{pesoActual} kg</p>
        </section>

        <section className="peso-card">
          <h2>Registrar nuevo peso</h2>

          <form onSubmit={guardarPeso} className="peso-form">
            <input
              type="number"
              step="0.1"
              min="1"
              value={nuevoPeso}
              onChange={(e) => setNuevoPeso(e.target.value)}
              placeholder="Ej. 70"
            />

            <button type="submit">Guardar peso</button>
          </form>

          {mensaje && <p className="mensaje-exito">{mensaje}</p>}
          {error && <p className="mensaje-error">{error}</p>}
        </section>

        <section className="peso-card">
            <h2>Historial</h2>

            {historial.length === 0 ? (
                <p>No hay datos suficientes para mostrar el gráfico.</p>
            ) : (
                <div className="grafico-peso">
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis domain={["dataMin - 2", "dataMax + 2"]} />
                    <Tooltip />
                    <Line
                        type="monotone"
                        dataKey="peso"
                        stroke="#2db84d"
                        strokeWidth={3}
                        dot={{ r: 5 }}
                    />
                    </LineChart>
                </ResponsiveContainer>
                </div>
            )}
          <h2> Pesos</h2>

          {historial.length === 0 ? (
            <p>No hay pesos registrados todavía.</p>
          ) : (
            <table className="peso-tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Peso</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((item, index) => (
                  <tr key={index}>
                    <td>{new Date(item.fecha).toLocaleDateString()}</td>
                    <td>{item.peso} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

export default SeguimientoPeso;