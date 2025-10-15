import React from "react";
import "../estilos/estilos_institucionBanner.css";

function InstitucionBanner({ nombreInstitucion }) {
  if (!nombreInstitucion) return null;

  return (
    <div className="institucion-banner">
      <div className="institucion-banner-contenido">
        <span className="institucion-banner-icono">🏫</span>
        <span className="institucion-banner-texto">{nombreInstitucion}</span>
      </div>
    </div>
  );
}

export default InstitucionBanner;