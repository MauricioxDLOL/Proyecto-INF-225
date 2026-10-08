import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar";
import HomePage from "./HomePage";
import MiCuentaFatSecret from "./MiCuentaFatSecret";
import VerificarAlimento from "./VerificarAlimento";
import Metas from "./Metas";
import Login from "./Login";
import Comunidad from "./Comunidad";
import BuscarAlimento from "./BuscarAlimento";
import SeguimientoPeso from "./SeguimientoPeso";
import PerfilPublico from "./PerfilPublico";
import PerfilPublicoVista from "./PerfilPublicoVista";

function App() {
  return (
    <BrowserRouter>
    <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<MiCuentaFatSecret />} />
        <Route path="/agregar" element={<BuscarAlimento />} />
        <Route path="/metas" element={<Metas />} />
        <Route path="/comunidad" element={<Comunidad />} />
        <Route path="/perfil" element={<PerfilPublico />} />
        <Route path="/miembro/:usuario" element={<PerfilPublicoVista />} />
        <Route path="/seguimiento-peso" element={<SeguimientoPeso />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;