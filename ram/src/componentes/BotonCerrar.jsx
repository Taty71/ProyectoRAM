import React from "react";
import "../estilos/botonCerrar.css";

function BotonCerrar({ onClick }) {
  return (
    <button className="boton-cerrar" onClick={onClick} title="Cerrar">
      <span>×</span>
    </button>
  );
}

export default BotonCerrar;
