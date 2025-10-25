import React from "react";
import "../estilos/modalVentana.css";
import BotonCerrar from "./BotonCerrar";

function ModalVentana({ open, onClose, children, titulo, wide = false, full = false, ultra = false, className = '' }) {
  if (!open) return null;
  const classes = ['modal-ventana', wide ? 'wide' : '', full ? 'full' : '', ultra ? 'ultra' : '', className].filter(Boolean).join(' ');
  return (
    <div className="modal-ventana-overlay">
      <div className={classes} role="dialog" aria-modal="true">
        <div className="modal-ventana-header">
          <h2>{titulo}</h2>
        <BotonCerrar onClick={onClose} />
        </div>
        <div className="modal-ventana-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ModalVentana;
