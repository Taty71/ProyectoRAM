import React from "react";
import RegistroInstitucion from "./RegistroInstitucion";
import BotonCerrar from "./BotonCerrar";

function ModalRegistroInstitucion({ visible, onClose, onInstitucionRegistrada }) {
  if (!visible) return null;
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      background: "rgba(0,0,0,0.25)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <div style={{
        background: "#f8fcff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
        padding: "2rem",
        minWidth: 340,
        maxWidth: 420,
        position: "relative"
      }}>
        <BotonCerrar onClick={onClose} style={{ position: "absolute", top: 12, right: 12 }} />
        <RegistroInstitucion onInstitucionRegistrada={onInstitucionRegistrada} />
      </div>
    </div>
  );
}

export default ModalRegistroInstitucion;
