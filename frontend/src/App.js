import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import MiCuentaFatSecret from "./MiCuentaFatSecret";
import VerificarAlimento from "./VerificarAlimento";
import Login from "./Login";
import Comunidad from "./Comunidad";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<MiCuentaFatSecret />} />
        <Route path="/agregar" element={<VerificarAlimento />} />
        <Route path="/comunidad" element={<Comunidad />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
