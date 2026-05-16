import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./HomePage";
import MiCuentaFatSecret from "./MiCuentaFatSecret";
import VerificarAlimento from "./VerificarAlimento";
import Login from "./Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/registro" element={<MiCuentaFatSecret />} />
        <Route path="/agregar" element={<VerificarAlimento />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
