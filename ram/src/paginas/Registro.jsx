import { useState, useEffect } from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import { administradorSchema } from "../utils/validatorYup";
import NotificationManager from "../utils/NotificationManager";
import InstitucionBanner from "../componentes/Institucion_Banner";
import "../estilos/colores.css";
import "../estilos/registro.css";

function Registro({ setPantalla, institucionId, institucionNombre: institucionNombreProp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [codigo, setCodigo] = useState("");
  const [rol, setRol] = useState("");
  const [notif, setNotif] = useState({ error: null, mensaje: "" });
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [institucionNombre, setInstitucionNombre] = useState(institucionNombreProp || "");
  
  const { error, clearError, handleAsync, setValidationError, formatError } = useErrorHandler();

  useEffect(() => {
    async function fetchInstitucion() {
      const storedId = institucionId || localStorage.getItem("institucionId");
      const storedNombre = localStorage.getItem("institucionNombre");
      
      if (storedNombre && !institucionNombre) {
        setInstitucionNombre(storedNombre);
      }
      
      if (!storedId) return;
      
      try {
        const res = await fetch(`http://localhost:3000/api/instituciones/${storedId}`);
        const data = await res.json();
        if (res.ok && data.institucion && data.institucion.nombre) {
          setInstitucionNombre(data.institucion.nombre);
          localStorage.setItem("institucionId", storedId);
          localStorage.setItem("institucionNombre", data.institucion.nombre);
          console.log('🏫 Institución guardada:', {
            id: storedId,
            nombre: data.institucion.nombre
          });
        }
      } catch (err) {
        console.error("Error al obtener institución:", err);
      }
    }
    fetchInstitucion();
  }, [institucionId, institucionNombre]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    clearError();
    setNotif({ error: null, mensaje: "" });
    
    try {
      await administradorSchema.validate({ 
        nombre, 
        apellido, 
        email, 
        password, 
        confirmarPassword,
        dni: dni || null,
        rol 
      });
    } catch (validationError) {
      setValidationError(validationError.message);
      setNotif({ error: { message: validationError.message }, mensaje: "" });
      setIsSubmitting(false);
      return;
    }
    
    if (!codigo) {
      setValidationError("Debes ingresar el código de invitación");
      setNotif({ error: { message: "Debes ingresar el código de invitación" }, mensaje: "" });
      setIsSubmitting(false);
      return;
    }
    
    // ✅ Obtener institucionId desde props o localStorage
    const storedInstitucionId = institucionId || localStorage.getItem("institucionId");
    
    // 🔍 LOG DE DEBUGGING
    console.log('🏫 Verificando institución:', {
      institucionIdProp: institucionId,
      institucionIdLocalStorage: localStorage.getItem("institucionId"),
      storedInstitucionId: storedInstitucionId
    });
    
    // ✅ Validar que exista institucionId
    if (!storedInstitucionId) {
      setValidationError("Error: No se pudo obtener la institución");
      setNotif({ error: { message: "Error: No se pudo obtener la institución. Por favor, recarga la página." }, mensaje: "" });
      setIsSubmitting(false); // ✅ AGREGADO
      return;
    }
    
    try {
      const payload = { 
        email, 
        password, 
        nombre, 
        apellido, 
        institucion: storedInstitucionId,
        codigoInvitacion: codigo,
        rol 
      };
      
      if (dni && dni.trim()) {
        payload.dni = dni.trim();
      }
      
      console.log('📤 ENVIANDO AL SERVIDOR:', JSON.stringify(payload, null, 2));
      
      await handleAsync(() => ErrorHandler.handleFetch("http://localhost:3000/api/auth/registro/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, "No se pudo registrar."));
      
      setNotif({ error: null, mensaje: "Usuario registrado exitosamente." });
      
      setEmail("");
      setPassword("");
      setConfirmarPassword("");
      setNombre("");
      setApellido("");
      setDni("");
      setCodigo("");
      setRol("");
    } catch (err) {
      console.error('❌ ERROR RECIBIDO:', err);
      setNotif({ error: { message: formatError(err) }, mensaje: "" });
    } finally {
      setIsSubmitting(false);
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
    if (!nombre || !apellido) {
      setValidationError("Debes ingresar tu nombre y apellido");
      setNotif({ error: { message: "Debes ingresar tu nombre y apellido" }, mensaje: "" });
      return;
    }
    if (!rol) {
      setValidationError("Debes seleccionar el rol");
      setNotif({ error: { message: "Debes seleccionar el rol" }, mensaje: "" });
      return;
    }
    
    const storedInstitucionId = institucionId || localStorage.getItem("institucionId");
    const storedInstitucionNombre = institucionNombre || localStorage.getItem("institucionNombre");
    
    console.log('📨 Enviando solicitud de código:', {
      email,
      nombre,
      apellido,
      rol,
      institucionId: storedInstitucionId,
      institucionNombre: storedInstitucionNombre
    });
    
    try {
      await handleAsync(() => ErrorHandler.handleFetch("http://localhost:3000/api/auth/solicitar-codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          nombre,
          apellido,
          dni: dni || null,
          rol: rol.charAt(0).toUpperCase() + rol.slice(1),
          institucion: storedInstitucionId,
          institucionNombre: storedInstitucionNombre
        })
      }, "No se pudo enviar la solicitud."));
      setNotif({ error: null, mensaje: "Solicitud enviada correctamente. El administrador te enviará el código por correo." });
    } catch (err) {
      setNotif({ error: { message: formatError(err) }, mensaje: "" });
    }
  };

  return (
    <div className="registro-container">
      <InstitucionBanner nombreInstitucion={institucionNombre} />
      <h2>Registro de usuario</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmarPassword}
          onChange={e => setConfirmarPassword(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <input
          type="text"
          placeholder="Apellido"
          value={apellido}
          onChange={e => setApellido(e.target.value)}
          required
          disabled={isSubmitting}
        />
        <input
          type="text"
          placeholder="DNI (opcional)"
          value={dni}
          onChange={e => setDni(e.target.value)}
          style={{ marginTop: "1rem" }}
          disabled={isSubmitting}
        />
        <select
          value={rol}
          onChange={e => setRol(e.target.value)}
          required
          style={{ marginTop: "1rem" }}
          disabled={isSubmitting}
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
          disabled={isSubmitting}
        />
        <button
          type="button"
          className="registro-link"
          style={{ marginTop: "0.5rem", marginBottom: "0.5rem" }}
          onClick={() => setMostrarSolicitud(v => !v)}
          disabled={isSubmitting}
        >
          {mostrarSolicitud ? "Ocultar solicitud de código" : "Solicitar código de invitación"}
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Registrando..." : "Registrarse"}
        </button>
        <button 
          type="button" 
          className="registro-link" 
          onClick={() => setPantalla("login")}
          disabled={isSubmitting}
        >
          Volver al login
        </button>
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
            <button type="submit" className="registro-link" style={{ marginTop: "0.5rem" }}>
              Enviar solicitud
            </button>
          </form>
        </div>
      )}
      <NotificationManager
        error={error || notif.error}
        mensaje={notif.mensaje}
        onClearError={() => {
          clearError();
          setNotif({ ...notif, error: null });
        }}
        onClearMensaje={() => setNotif({ ...notif, mensaje: "" })}
        autoHide={true}
        hideDelay={3500}
      />
    </div>
  );
}

export default Registro;