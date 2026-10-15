import { useNavigate, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("usuario");
    if (storedUser) {
      try {
        setUsuario(JSON.parse(storedUser));
      } catch {
        setUsuario({ nombre: storedUser });
      }
    }
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem("usuario");
    setUsuario(null);
    window.location.reload();
  };

  const isActive = (path) => location.pathname === path ? "active" : "";

return (
    <header className="global-header">
      <div className="top-bar">
        <Link to="/" className="logo">Fatsecret</Link>

        <nav className="main-nav">
          <Link to="/" className={isActive("/")}>Inicio</Link>
          <Link to="/comunidad" className={isActive("/comunidad")}>Comunidad</Link>
          <Link to="/agregar" className={isActive("/agregar")}>Alimentos</Link>
          <Link to="/metas" className={isActive("/metas")}>Metas</Link>
          <Link to="/perfil" className={isActive("/perfil")}>Perfil</Link>
          <Link to="/seguimiento-peso" className={isActive("/seguimiento-peso")}>Historial de Peso</Link>
          <Link to="/recetario" className={isActive("/recetario")}>Recetario</Link>
        </nav>

        <div className="user-nav">
          {usuario ? (
            <>
              <span className="user-greeting">Hola, {usuario.nombre || usuario} 👋</span>
              <button className="auth-btn" onClick={cerrarSesion}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <button className="auth-btn" onClick={() => navigate("/login")}>Iniciar sesión</button>
              <button className="auth-btn" onClick={() => navigate("/registro")}>Registrarse</button>
            </>
          )}
        </div>
      </div>
    
    </header>
  );
}
