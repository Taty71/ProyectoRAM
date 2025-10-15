import React from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import NotificationManager from "../utils/NotificationManager";
import "../estilos/desactivarCodigo.css";

function DesactivarCodigo() {
  const [codigo, setCodigo] = React.useState("");
  const { error, clearError, setValidationError } = useErrorHandler();
  const [mensaje, setMensaje] = React.useState("");
  const [cargando, setCargando] = React.useState(false);

  const handleChange = e => setCodigo(e.target.value);

  const handleSubmit = async e => {
    e.preventDefault();
    clearError();
    setMensaje("");
    if (!codigo.trim()) {
      setValidationError("Debes ingresar el código a desactivar");
      return;
    }
    setCargando(true);
    try {
      const token = localStorage.getItem("token");
      await ErrorHandler.handleFetch(
        `http://localhost:3000/api/auth/desactivar-codigo/${codigo}`,
        {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        },
        "Error desactivando código"
      );
      setMensaje("Código desactivado exitosamente");
      setCodigo("");
    } catch (errorObj) {
      setValidationError(errorObj.message || "Error al desactivar el código");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="desactivar-codigo-container">
      <h3>Desactivar código de invitación</h3>
      <form className="desactivar-codigo-form" onSubmit={handleSubmit}>
        <label>
          Código a desactivar
          <input type="text" name="codigo" value={codigo} onChange={handleChange} required />
        </label>
        <button type="submit" className="btn-desactivar-codigo" disabled={cargando}>
          {cargando ? "Desactivando..." : "Desactivar"}
        </button>
      </form>
      <NotificationManager
        error={error}
        mensaje={mensaje}
        onClearError={clearError}
        onClearMensaje={() => setMensaje("")}
      />
    </div>
  );
}

export default DesactivarCodigo;
