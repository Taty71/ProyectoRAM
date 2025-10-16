import React from "react";
import "../estilos/estilos_institucionBanner.css";

function InstitucionBanner({ nombreInstitucion, institucionId }) {
  // Si hay un id pero no un nombre, mostramos un estado de carga breve
  const nombre = nombreInstitucion || (institucionId ? 'Cargando institución...' : 'Institución no seleccionada');
  return (
    <div className="institucion-banner" role="banner" aria-live="polite">
      <div className="institucion-banner-contenido small">
        <span className="institucion-banner-icono" aria-hidden>🏫</span>
        <span className="institucion-banner-texto">{nombre}</span>
      </div>
    </div>
  );
}

export default InstitucionBanner;