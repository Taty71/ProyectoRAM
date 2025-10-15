
import React from "react";
import * as Yup from "yup";
import BotonCerrar from "./BotonCerrar";
// import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import NotificationManager from "../utils/NotificationManager";
import "../estilos/colores.css";
import "../estilos/gestionCodigos.css";

// ...existing code...
import CrearCodigo from "./CrearCodigo";
import ListaCodigos from "./ListaCodigos";
import DesactivarCodigo from "./DesactivarCodigo";
import "../estilos/gestionCodigos.css";

const acciones = [
  { key: "crear", label: "Crear código", icon: "🆕" },
  { key: "listar", label: "Ver códigos", icon: "📋" },
  { key: "desactivar", label: "Desactivar código", icon: "🔒" }
];


function GestionCodigosInvitacion({ institucionId, institucionNombre }) {
  const [accion, setAccion] = React.useState(null);
  const [reloadFlag, setReloadFlag] = React.useState(false);

  // Función para forzar recarga de la lista
  const recargarLista = () => setReloadFlag(flag => !flag);

  return (
    <div className="gestion-codigos-container">
      <div className="acciones-codigos-menu">
        {acciones.map(a => (
          <button
            key={a.key}
            className={`btn-accion-codigo${accion === a.key ? " activo" : ""}`}
            onClick={() => setAccion(a.key)}
          >
            <span className="accion-icon" style={{ marginRight: "0.5em" }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </div>
      <div className="accion-codigos-content">
        {accion === "crear" && <CrearCodigo institucionId={institucionId} institucionNombre={institucionNombre} onCodigoCreado={recargarLista} />}
        {accion === "listar" && <ListaCodigos reloadFlag={reloadFlag} />}
        {accion === "desactivar" && <DesactivarCodigo onCodigoDesactivado={recargarLista} />}
      </div>
    </div>
  );
}

export default GestionCodigosInvitacion;