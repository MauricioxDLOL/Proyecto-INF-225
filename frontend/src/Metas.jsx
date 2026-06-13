import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Metas.css";

function Metas() {
  const navigate = useNavigate();

  const [metas, setMetas] = useState({
    calorias: "",
    proteina: "",
    carbohidratos: "",
    grasa: "",
    agua: "",
  });

  useEffect(() => {
    async function cargarMetas() {
      try {
        const storedUser = localStorage.getItem("usuario");
        if (!storedUser) return;

        const usuarioObj = JSON.parse(storedUser);

        const res = await fetch(`http://localhost:3000/metas/${usuarioObj.id}`);
        if (!res.ok) return;

        const data = await res.json();
        setMetas(data);
      } catch (err) {
        console.error(err);
      }
    }

    cargarMetas();
  }, []);

  const actualizar = (e) => {
    setMetas({
      ...metas,
      [e.target.name]: e.target.value,
    });
  };

  const guardarMetas = async () => {
    try {
      const storedUser = localStorage.getItem("usuario");
      if (!storedUser) {
        alert("Debes iniciar sesión");
        return;
      }

      const usuarioObj = JSON.parse(storedUser);

      const respuesta = await fetch("http://localhost:3000/metas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario: usuarioObj.nombre,
          ...metas,
        }),
      });

      const data = await respuesta.json();

      if (!respuesta.ok) {
        alert(data.error);
        return;
      }

      alert("Metas guardadas");
      navigate("/");
    } catch {
      alert("Error al guardar metas");
    }
  };

  return (
    <div className="metas-page">
      <h1>Configurar metas</h1>

      <div className="form-card">
        <label>Calorías (kcal)</label>
        <input
          type="number"
          name="calorias"
          value={metas.calorias || ""}
          onChange={actualizar}
        />

        <label>Proteína (g)</label>
        <input
          type="number"
          name="proteina"
          value={metas.proteina || ""}
          onChange={actualizar}
        />

        <label>Carbohidratos (g)</label>
        <input
          type="number"
          name="carbohidratos"
          value={metas.carbohidratos || ""}
          onChange={actualizar}
        />

        <label>Grasas (g)</label>
        <input
          type="number"
          name="grasa"
          value={metas.grasa || ""}
          onChange={actualizar}
        />

        <label>Agua (ml)</label>
        <input
          type="number"
          name="agua"
          value={metas.agua || ""}
          onChange={actualizar}
        />

        <button onClick={guardarMetas}>Guardar metas</button>
      </div>
    </div>
  );
}

export default Metas;
