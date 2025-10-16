import { useState, useEffect } from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import { loginSchema, recuperoSchema } from "../utils/validatorYup";
import NotificationManager from "../utils/NotificationManager";
import BotonCerrar from "../componentes/BotonCerrar";
import InstitucionBanner from "../componentes/Institucion_Banner";
import "../estilos/colores.css";
import "../estilos/login.css";

function Login({ onLogin, setPantalla }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notif, setNotif] = useState({ error: null, mensaje: "" });
  const [recupero, setRecupero] = useState(false);
  const [recuperoEmail, setRecuperoEmail] = useState("");
  const [institucionNombre, setInstitucionNombre] = useState("");
  
  const institucionId = localStorage.getItem("institucionId") || "";
  const { error, clearError, handleAsync, setValidationError, formatError } = useErrorHandler();

  useEffect(() => {
    async function fetchInstitucion() {
      if (!institucionId) return;
      try {
        const res = await fetch(`http://localhost:3000/api/instituciones/${institucionId}`);
        const data = await res.json();
        if (res.ok && data.institucion && data.institucion.nombre) {
          setInstitucionNombre(data.institucion.nombre);
          localStorage.setItem("institucionNombre", data.institucion.nombre);
        }
      } catch (err) {
        console.error("Error al obtener institución:", err);
        // Fallback: si ya hay un nombre almacenado en localStorage, úsalo
        const storedNombre = localStorage.getItem("institucionNombre");
        if (storedNombre) {
          setInstitucionNombre(storedNombre);
        }
      }
    }
    fetchInstitucion();
  }, [institucionId]);

  const handleRecupero = async (e) => {
    e.preventDefault();
    clearError();
    setNotif({ error: null, mensaje: "" });
    try {
      await recuperoSchema.validate({ email: recuperoEmail });
    } catch (validationError) {
      setValidationError(validationError.message);
      setNotif({ error: { message: validationError.message }, mensaje: "" });
      return;
    }
    try {
      await handleAsync(() => ErrorHandler.handleFetch("http://localhost:3000/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recuperoEmail }),
      }, "No se pudo enviar el correo."));
      setNotif({ error: null, mensaje: "Si el correo está registrado, recibirás instrucciones." });
    } catch (err) {
      setNotif({ error: { message: formatError(err) }, mensaje: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setNotif({ error: null, mensaje: "" });
    try {
      await loginSchema.validate({ email, password });
    } catch (validationError) {
      setValidationError(validationError.message);
      setNotif({ error: { message: validationError.message }, mensaje: "" });
      return;
    }
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
      <InstitucionBanner nombreInstitucion={institucionNombre} />
      <div className="login-logo-fixed">
        <img src="/logo-ram.png" alt="Logo RAM" style={{ width: "180px", maxWidth: "40vw" }} />
      </div>
      <div className="login-container lateral">
        <BotonCerrar onClick={() => setPantalla && setPantalla("presentacion")} />
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