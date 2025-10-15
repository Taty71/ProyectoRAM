import { useState } from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import { administradorSchema } from "../utils/validatorYup";
import NotificationManager from "../utils/NotificationManager";
import SelectInstitucion from "../componentes/SelectInstitucion";
import "../estilos/colores.css";
import "../estilos/registro.css";


function Registro({ setPantalla, institucionId, institucionNombre }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [codigo, setCodigo] = useState("");
  const [rol, setRol] = useState("");
  const [notif, setNotif] = useState({ error: null, mensaje: "" });
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false);
  // ErrorHandler hook
  const { error, clearError, handleAsync, setValidationError, formatError } = useErrorHandler();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setNotif({ error: null, mensaje: "" });
    // Validar con Yup
    try {
      await administradorSchema.validate({ nombre, apellido, email, password, confirmarPassword: password, dni: "12345678", rol });
    } catch (validationError) {
      setValidationError(validationError.message);
      setNotif({ error: { message: validationError.message }, mensaje: "" });
      return;
    }
    if (!codigo) {
      setValidationError("Debes ingresar el código de invitación");
      setNotif({ error: { message: "Debes ingresar el código de invitación" }, mensaje: "" });
      return;
    }
    try {
      await handleAsync(() => ErrorHandler.handleFetch("http://localhost:3000/api/auth/registro/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nombre, apellido, institucion: institucionId, codigo: codigo, rol })
      }, "No se pudo registrar."));
      setNotif({ error: null, mensaje: "Usuario registrado exitosamente." });
    } catch (err) {
      setNotif({ error: { message: formatError(err) }, mensaje: "" });
    }
  };

  const handleSolicitudCodigo = async (e) => {
    e.preventDefault();
    clearError();
    setNotif({ error: null, mensaje: "" });
    if (!email) {
      setValidationError("Debes ingresar tu correo electrónico");
      setNotif({ error: { message: "Debes ingresar tu correo electrónico" }, mensaje: "" });
      return;
    }
    if (!rol) {
      setValidationError("Debes seleccionar el rol");
      setNotif({ error: { message: "Debes seleccionar el rol" }, mensaje: "" });
      return;
    }
    try {
      await handleAsync(() => ErrorHandler.handleFetch("http://localhost:3000/api/auth/solicitar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          nombre,
          apellido,
          rol: rol.charAt(0).toUpperCase() + rol.slice(1),
          institucion: institucionId,
          institucionNombre
        })
      }, "No se pudo enviar la solicitud."));
      setNotif({ error: null, mensaje: "Solicitud enviada correctamente. El administrador te enviará el código por correo." });
    } catch (err) {
      setNotif({ error: { message: formatError(err) }, mensaje: "" });
    }
  };

  return (
    <div className="registro-container">
      <h2>Registro de usuario</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <input
            // ...existing code...
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Apellido"
          value={apellido}
          onChange={e => setApellido(e.target.value)}
          required
        />
        <select
          value={rol}
          onChange={e => setRol(e.target.value)}
          required
          style={{ marginTop: "1rem" }}
        >
          <option value="">Selecciona el rol</option>
          <option value="profesor">Profesor</option>
          <option value="estudiante">Estudiante</option>
        </select>
        <input
          type="text"
          placeholder="Código de invitación"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          required
          style={{ marginTop: "1rem" }}
        />
        <button
          type="button"
          className="registro-link"
          style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
          onClick={() => setMostrarSolicitud(v => !v)}
        >
          {mostrarSolicitud ? "Ocultar solicitud de código" : "Solicitar código de invitación"}
        </button>
        {institucionNombre && (
          <div style={{ margin: "1rem 0", fontWeight: "bold", color: "#2980b9" }}>
            Institución: {institucionNombre}
          </div>
        )}
        <button type="submit">Registrarse</button>
        <button type="button" className="registro-link" onClick={() => setPantalla("login")}>Volver al login</button>
      </form>
      {mostrarSolicitud && (
        <div className="solicitud-codigo-container" style={{ marginTop: "1rem", background: "#f7f7f7", borderRadius: "8px", padding: "1rem" }}>
          <h4>Solicitar código de invitación</h4>
          <form onSubmit={handleSolicitudCodigo}>
            <input
              type="text"
              placeholder="Nombre"
              value={nombre}
              readOnly
              required
              style={{ marginBottom: "0.5rem", background: '#eaeaea', fontWeight: 'bold' }}
            />
            <input
              type="text"
              placeholder="Apellido"
              value={apellido}
              readOnly
              required
              style={{ marginBottom: "0.5rem", background: '#eaeaea', fontWeight: 'bold' }}
            />
            <input
              type="email"
              placeholder="Tu correo electrónico"
              value={email}
              readOnly
              required
              style={{ marginBottom: "0.5rem", background: '#eaeaea', fontWeight: 'bold' }}
            />
            <input
              type="text"
              placeholder="Rol"
              value={rol ? rol.charAt(0).toUpperCase() + rol.slice(1) : ""}
              readOnly
              required
              style={{ marginBottom: "0.5rem", background: '#eaeaea', fontWeight: 'bold' }}
            />
            {institucionNombre && (
              <div style={{ marginBottom: "0.5rem", fontWeight: "bold", color: "#2980b9" }}>
                Institución: {institucionNombre}
              </div>
            )}
            <button type="submit" className="registro-link" style={{ marginTop: "0.5rem" }}>Enviar solicitud</button>
          </form>
        </div>
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
  );
}

export default Registro;
