// frontend/src/PerfilPublicoVista.jsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import "./PerfilPublico.css";

const API = "http://localhost:3000";

export default function PerfilPublicoVista() {
  const { usuario } = useParams();
  const [perfil, setPerfil] = useState(null);
  const [estado, setEstado] = useState("cargando"); // cargando | ok | no_disponible | error

  useEffect(() => {
    setEstado("cargando");
    fetch(`${API}/perfil-publico/${encodeURIComponent(usuario)}`)
      .then(async (r) => {
        if (r.status === 404) return setEstado("no_disponible");
        if (!r.ok) throw new Error();
        setPerfil(await r.json());
        setEstado("ok");
      })
      .catch(() => setEstado("error"));
  }, [usuario]);

  if (estado === "cargando") return <p className="pp-aviso">Cargando perfil…</p>;
  if (estado === "no_disponible")
    return (
      <div className="pp-contenedor">
        <h2>Perfil no disponible</h2>
        <p className="pp-intro">Este perfil es privado o no existe.</p>
        <Link to="/comunidad">Volver a la comunidad</Link>
      </div>
    );
  if (estado === "error") return <p className="pp-aviso">No se pudo conectar con el servidor.</p>;

  const lista = (items) =>
    items.length === 0 ? (
      <span className="pv-vacio">Ninguna</span>
    ) : (
      items.map((i) => (
        <span key={i} className="pv-chip">
          {i}
        </span>
      ))
    );

  return (
    <div className="pp-contenedor">
      <h2>{perfil.nombre_publico}</h2>
      <p className="pp-intro">@{perfil.usuario}</p>

      {perfil.ciudad && (
        <p className="pv-dato">
          <strong>Ciudad:</strong> {perfil.ciudad}
        </p>
      )}
      {perfil.biografia && <p className="pv-bio">{perfil.biografia}</p>}
      {perfil.intereses && (
        <p className="pv-dato">
          <strong>Intereses:</strong> {perfil.intereses}
        </p>
      )}

      {(perfil.tipo_dieta !== undefined ||
        perfil.intolerancias !== undefined ||
        perfil.alimentos_restringidos !== undefined) && (
        <section>
          <h3>Restricciones alimentarias</h3>
          {perfil.tipo_dieta !== undefined && (
            <p className="pv-dato">
              <strong>Dieta:</strong> {perfil.tipo_dieta || "Sin registrar"}
            </p>
          )}
          {perfil.intolerancias !== undefined && (
            <p className="pv-dato">
              <strong>Intolerancias:</strong> {lista(perfil.intolerancias)}
            </p>
          )}
          {perfil.alimentos_restringidos !== undefined && (
            <p className="pv-dato">
              <strong>Alimentos restringidos:</strong> {lista(perfil.alimentos_restringidos)}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
