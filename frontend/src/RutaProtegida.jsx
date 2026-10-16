
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

function RutaProtegida({ children }) {
  const location = useLocation();

  let usuario = null;

  try {
    usuario = JSON.parse(localStorage.getItem("usuario"));
  } catch {
    usuario = null;
  }

  if (!usuario?.id || !usuario?.nombre) {
    return (
      <Navigate
        to="/login"
        state={{ desde: location.pathname }}
        replace
      />
    );
  }

  return children;
}

export default RutaProtegida;
