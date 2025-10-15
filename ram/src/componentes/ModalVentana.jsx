import React from "react";
import "../estilos/modalVentana.css";

function ModalVentana({ open, onClose, children, titulo }) {
  if (!open) return null;
  return (
    <div className="modal-ventana-overlay">
      <div className="modal-ventana">
        <div className="modal-ventana-header">
          <h2>{titulo}</h2>
          <button className="modal-ventana-close" onClick={onClose} title="Cerrar">&#x2716;</button>
        </div>
        <div className="modal-ventana-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default ModalVentana;
