import { useState } from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
// import eliminado: useState, useEffect duplicado
import { loginSchema, recuperoSchema } from "../utils/validatorYup";
import NotificationManager from "../utils/NotificationManager";
import BotonCerrar from "../componentes/BotonCerrar";
import "../estilos/colores.css";
import "../estilos/login.css";


function Login({ onLogin, setPantalla }) {
  // Eliminado: mostrarRegistroInstitucion, setMostrarRegistroInstitucion
  // Eliminar selector de rol, solo login por email/contraseña
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notif, setNotif] = useState({ error: null, mensaje: "" });
  const [recupero, setRecupero] = useState(false);
  const [recuperoEmail, setRecuperoEmail] = useState("");
  const institucionId = localStorage.getItem("institucionId") || "";
  const institucionNombre = localStorage.getItem("institucionNombre") || "";
  // ErrorHandler hook
  const { error, clearError, handleAsync, setValidationError, formatError } = useErrorHandler();


  const handleRecupero = async (e) => {
    e.preventDefault();
    clearError();
    setNotif({ error: null, mensaje: "" });
    // Validar con Yup
    try {
      await recuperoSchema.validate({ email: recuperoEmail });
    } catch (validationError) {
      setValidationError(validationError.message);
      setNotif({ error: { message: validationError.message }, mensaje: "" });
      return;
    }
    let url = "http://localhost:3000/api/auth/recuperar";
    try {
      await handleAsync(() => ErrorHandler.handleFetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recuperoEmail }),
      }, "No se pudo enviar el correo."));
      setNotif({ error: null, mensaje: "Si el correo está registrado, recibirás instrucciones." });
    } catch (err) {
      setNotif({ error: { message: formatError(err) }, mensaje: "" });
    }
  };

  // Primer submit: solo email y contraseña
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setNotif({ error: null, mensaje: "" });
    // Validar con Yup
    try {
      await loginSchema.validate({ email, password });
    } catch (validationError) {
      setValidationError(validationError.message);
      setNotif({ error: { message: validationError.message }, mensaje: "" });
      return;
    }
    // Login directo con institución
    try {
      const data = await handleAsync(() => ErrorHandler.handleFetch("http://localhost:3000/api/auth/login/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, institucion: institucionId })
      }, "Credenciales inválidas o usuario no pertenece a la institución"));
      localStorage.setItem("token", data.token || "");
      localStorage.setItem("rol", data.rol || "usuario");
      localStorage.setItem("nombre", data.nombre || "");
      localStorage.setItem("userId", data.userId || "");
      if (onLogin) {
        onLogin(data.rol || "usuario", data.token || "", data.nombre || "");
      }
    } catch (err) {
      setNotif({ error: { message: formatError(err) }, mensaje: "" });
    }
  };

  return (
    <div className="login-page-bg">
      <div className="login-logo-fixed">
        <img src="/logo-ram.png" alt="Logo RAM" style={{ width: "180px", maxWidth: "40vw" }} />
      </div>
      <div className="login-container lateral">
        <BotonCerrar onClick={() => setPantalla && setPantalla("presentacion") } />
        <h2>Iniciar sesión</h2>
        {!recupero ? (
          <>
            <form onSubmit={handleSubmit} className="login-form">
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="login-input"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="login-input"
              />
              {institucionNombre && (
                <div style={{ margin: "1rem 0", fontWeight: "bold", color: "#2980b9" }}>
                  Institución: {institucionNombre}
                </div>
              )}
              <button type="submit" className="login-btn">Ingresar</button>
              <div className="login-links">
                <button type="button" className="recupero-link" onClick={() => setRecupero(true)}>
                  ¿Olvidaste tu contraseña?
                </button>
                <button
                  type="button"
                  className="registro-link"
                  style={{ marginLeft: "1rem" }}
                  onClick={() => {
                    if (institucionId) {
                      localStorage.setItem("institucionId", institucionId);
                    }
                    setPantalla && setPantalla("registro");
                  }}
                >
                  Registrarse
                </button>
              </div>
            </form>
          </>
        ) : (
          <form onSubmit={handleRecupero} className="login-form">
            <input
              type="email"
              placeholder="Ingresa tu correo"
              value={recuperoEmail}
              onChange={e => setRecuperoEmail(e.target.value)}
              required
              className="login-input"
            />
            <button type="submit" className="login-btn">Recuperar contraseña</button>
            <div className="login-links">
              <button type="button" className="recupero-link" onClick={() => setRecupero(false)}>
                Volver al login
              </button>
            </div>
          </form>
        )}
        <NotificationManager
          error={error || notif.error}
          mensaje={notif.mensaje}
          onClearError={clearError}
          onClearMensaje={() => setNotif({ ...notif, mensaje: "" })}
          autoHide={true}
          hideDelay={3500}
        />
      </div>
    </div>
  );
}

export default Login;
