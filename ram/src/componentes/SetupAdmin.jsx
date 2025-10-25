import React from "react";
import { administradorSchema } from "../utils/validatorYup";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import { useNotification } from '../hooks/useNotification';
import InputText from "./InputText";
import "../estilos/SetupAdmin.css";

function SetupAdmin({
  administrador,
  setAdministrador,
  erroresCampos,
  setErroresCampos,
  setPaso,
 
  cargando,
  setCargando,
  onSetupComplete
}) {
  const { error, clearError, setValidationError } = useErrorHandler();
  // ...existing code...
  const { notify } = useNotification();

  const handleAdminChange = (e) => {
    setAdministrador(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmitAdministrador = async (e) => {
    e.preventDefault();
    clearError();
    setErroresCampos({});
    try {
      await administradorSchema.validate(administrador, { abortEarly: false });
      setCargando(true);
      await ErrorHandler.handleFetch(
        "http://localhost:3000/api/setup/administrador",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: administrador.nombre,
            apellido: administrador.apellido,
            email: administrador.email,
            dni: administrador.dni,
            password: administrador.password
          })
        },
        "Error al crear el administrador"
      );
  notify("Sistema configurado exitosamente. Redirigiendo al login...");
      setTimeout(() => {
        onSetupComplete && onSetupComplete();
      }, 2000);
    } catch (err) {
      if (err.name === 'ValidationError') {
        const fieldErrors = {};
        err.inner.forEach(e => {
          fieldErrors[e.path] = e.message;
        });
        setErroresCampos(fieldErrors);
        setValidationError("Corrige los errores marcados en el formulario.");
      } else if (err.details && Array.isArray(err.details)) {
        // Error del backend con detalles
        setValidationError((err.message || "Corrige los errores marcados en el formulario.") + "\n" + err.details.map(d => `• ${d.msg} (${d.param})`).join("\n"));
      } else {
        setValidationError(err.message || "Error inesperado o de red");
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmitAdministrador} className="setup-form">
      <h2>Crear Administrador del Sistema</h2>
      <div className="setup-row">
        <InputText
          label="Nombre *"
          name="nombre"
          value={administrador.nombre}
          onChange={handleAdminChange}
          required
          error={erroresCampos.nombre}
        />
        <InputText
          label="Apellido *"
          name="apellido"
          value={administrador.apellido}
          onChange={handleAdminChange}
          required
          error={erroresCampos.apellido}
        />
      </div>
      <div className="setup-row">
        <InputText
          label="Email *"
          name="email"
          type="email"
          value={administrador.email}
          onChange={handleAdminChange}
          required
          error={erroresCampos.email}
        />
        <InputText
          label="DNI *"
          name="dni"
          value={administrador.dni}
          onChange={handleAdminChange}
          required
          error={erroresCampos.dni}
        />
      </div>
      <div className="setup-row">
        <InputText
          label="Contraseña *"
          name="password"
          type="password"
          value={administrador.password}
          onChange={handleAdminChange}
          minLength={6}
          required
          error={erroresCampos.password}
        />
        <InputText
          label="Confirmar Contraseña *"
          name="confirmarPassword"
          type="password"
          value={administrador.confirmarPassword}
          onChange={handleAdminChange}
          minLength={6}
          required
          error={erroresCampos.confirmarPassword}
        />
      </div>
      <div className="setup-buttons">
        <button 
          type="button" 
          onClick={() => setPaso(1)}
          className="setup-btn-secondary"
        >
          Volver
        </button>
        <button type="submit" disabled={cargando} className="setup-btn-primary">
          {cargando ? "Configurando sistema..." : "Finalizar Configuración"}
        </button>
      </div>
      {error && (
        <div className="setup-error-message">{error.message || error}</div>
      )}
      {/* success messages are shown via NotificationContext */}
    </form>
  );
}

export default SetupAdmin;
