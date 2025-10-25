import { useState, useEffect } from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import { administradorSchema } from "../utils/validatorYup";
import { useNotification } from '../hooks/useNotification';
import InstitucionBanner from "../componentes/Institucion_Banner";
import "../estilos/colores.css";
import "../estilos/registro.css";
import "../estilos/registro_estudiante.css";

function Registro({ setPantalla, institucionId, institucionNombre: institucionNombreProp }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [dni, setDni] = useState("");
  const [codigo, setCodigo] = useState("");
  const [rol, setRol] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [especialidad, setEspecialidad] = useState("");
  const [anio, setAnio] = useState("");
  const [divisionEst, setDivisionEst] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [especialidadesOptions, setEspecialidadesOptions] = useState([]);
  const [showEspecialidadSelect, setShowEspecialidadSelect] = useState(false);
  const { notify, notifyError, clearMensaje } = useNotification();
  const [mostrarSolicitud, setMostrarSolicitud] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [institucionNombre, setInstitucionNombre] = useState(institucionNombreProp || "");
  
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [createdIdEstudiante, setCreatedIdEstudiante] = useState(null);
  
  const { clearError, handleAsync, setValidationError, formatError } = useErrorHandler();

  useEffect(() => {
    async function fetchInstitucion() {
      const storedId = institucionId || localStorage.getItem("institucionId");
      const storedNombre = localStorage.getItem("institucionNombre");
      
      if (storedNombre && !institucionNombre) {
        setInstitucionNombre(storedNombre);
      }
      
      // Si ya tenemos el id en props o localStorage, pedir datos específicos
      if (storedId) {
        try {
          const res = await fetch(`http://localhost:3000/api/instituciones/${storedId}`);
          const data = await res.json();
          if (res.ok && data.institucion && data.institucion.nombre) {
            setInstitucionNombre(data.institucion.nombre);
            localStorage.setItem("institucionId", storedId);
            localStorage.setItem("institucionNombre", data.institucion.nombre);
            // Cargar especialidades si la institución configuró alguna
            try {
              const inst = data.institucion;
              const cfgEspecialidades = (inst.configuracion && Array.isArray(inst.configuracion.especialidades)) ? inst.configuracion.especialidades : [];
              if (cfgEspecialidades.length > 0) {
                setEspecialidadesOptions(cfgEspecialidades);
                setShowEspecialidadSelect(true);
              } else {
                setEspecialidadesOptions([]);
                setShowEspecialidadSelect(false);
              }
            } catch (err) {
              console.warn('Error al procesar especialidades de la institución:', err);
            }
            console.log('🏫 Institución guardada:', {
              id: storedId,
              nombre: data.institucion.nombre
            });
          }
        } catch (err) {
          console.error("Error al obtener institución por id:", err);
          const storedNombre = localStorage.getItem("institucionNombre");
          if (storedNombre) setInstitucionNombre(storedNombre);
        }
        return;
      }

      // Si no hay id, intentar obtener la institución 'activa' por API como fallback
      try {
        const resActiva = await fetch("http://localhost:3000/api/instituciones/activa");
        const dataActiva = await resActiva.json();
        if (resActiva.ok && dataActiva.institucion) {
          const inst = dataActiva.institucion;
          setInstitucionNombre(inst.nombre);
          // Cargar especialidades dinámicamente si están configuradas y mostrar select
          const cfgEspecialidades = (inst.configuracion && Array.isArray(inst.configuracion.especialidades)) ? inst.configuracion.especialidades : [];
          if (cfgEspecialidades.length > 0) {
            setEspecialidadesOptions(cfgEspecialidades);
            setShowEspecialidadSelect(true);
          } else {
            setEspecialidadesOptions([]);
            setShowEspecialidadSelect(false);
          }
          if (inst._id) localStorage.setItem("institucionId", inst._id);
          localStorage.setItem("institucionNombre", inst.nombre);
          console.log('🏫 Institución activa encontrada y guardada:', inst);
        }
      } catch (err) {
        console.error("Error al obtener institución activa:", err);
      }
    }
    fetchInstitucion();
  }, [institucionId, institucionNombre]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    setIsSubmitting(true);
  clearError();
  clearMensaje();
    
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
      notifyError(validationError.message);
      setIsSubmitting(false);
      return;
    }
    
    if (!codigo) {
      setValidationError("Debes ingresar el código de invitación");
      notifyError("Debes ingresar el código de invitación");
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
    
    // Si no hay institucionId, intentamos enviar institucionNombre (fallback)
    const storedInstitucionNombre = institucionNombre || localStorage.getItem("institucionNombre");
    if (!storedInstitucionId && !storedInstitucionNombre) {
      setValidationError("Error: No se pudo obtener la institución");
      notifyError("Error: No se pudo obtener la institución. Por favor, recarga la página.");
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Si es estudiante, armar payload para el endpoint de estudiantes
      if (rol === 'estudiante') {
        // Validaciones simples del cliente
        const errors = {};
        if (!anio) errors.anio = 'Año requerido';
        else if (isNaN(Number(anio)) || Number(anio) < 1 || Number(anio) > 7) errors.anio = 'Año inválido (1-7)';
        if (!divisionEst) errors.division = 'División requerida';
  // Sólo requerir especialidad si el select está visible para la institución
  if (showEspecialidadSelect && !especialidad) errors.especialidad = 'Especialidad requerida';
        if (!fechaNacimiento) errors.fechaNacimiento = 'Fecha de nacimiento requerida';
        else {
          // Validar edad plausible para nivel secundario (12-20 años)
          const nacimiento = new Date(fechaNacimiento);
          const ahora = new Date();
          let edad = ahora.getFullYear() - nacimiento.getFullYear();
          const m = ahora.getMonth() - nacimiento.getMonth();
          if (m < 0 || (m === 0 && ahora.getDate() < nacimiento.getDate())) edad--;
          if (edad < 12 || edad > 20) {
            errors.fechaNacimiento = 'Edad fuera del rango permitido (12-20 años)';
          }
        }
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
          setValidationError('Completa los campos del estudiante.');
          notifyError('Completa los campos del estudiante.');
          setIsSubmitting(false);
          return;
        }

        // Validar que DNI esté presente (requisito del sistema)
        if (!dni || !dni.trim()) {
          setValidationError('Debes ingresar tu DNI');
          notifyError('Debes ingresar tu DNI');
          setIsSubmitting(false);
          return;
        }
        // Enviar al endpoint de registro de estudiantes. NO enviamos `institucion` ni `institucionNombre` desde el cliente;
        // el servidor usa la institución activa configurada en el setup.
        const payloadEst = {
          nombre,
          apellido,
          dni: dni && dni.trim() ? dni.trim() : null,
          email,
          password,
          ...(showEspecialidadSelect && especialidad ? { especialidad } : {}),
          anio: parseInt(anio, 10),
          division: divisionEst,
          fechaNacimiento: fechaNacimiento,
          codigoInvitacion: codigo,
          rol: 'estudiante'
        };

        console.log('📤 ENVIANDO AL SERVIDOR (estudiante -> estudiantes):', JSON.stringify(payloadEst, null, 2));
        const result = await handleAsync(() => ErrorHandler.handleFetch("http://localhost:3000/api/auth/registro/usuario", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadEst)
        }, "No se pudo registrar al estudiante."));

        notify('Estudiante registrado exitosamente.');
        // Mostrar idEstudiante devuelto por la API
        const idEst = (result && result.estudiante && result.estudiante.idEstudiante) ? result.estudiante.idEstudiante : null;
        if (idEst) {
          setCreatedIdEstudiante(idEst);
          setShowStudentModal(true);
        }

        // limpiar campos
        setEmail(""); setPassword(""); setConfirmarPassword(""); setNombre(""); setApellido(""); setDni(""); setCodigo(""); setRol("");
        setFechaNacimiento(""); setEspecialidad(""); setAnio(""); setDivisionEst("");
        setFieldErrors({});
        setIsSubmitting(false);
        return;
      }

      // Payload para usuarios (profesor / jefe_area)
      const payload = { 
        email, 
        password, 
        nombre, 
        apellido, 
        institucion: storedInstitucionId || null,
        institucionNombre: storedInstitucionId ? undefined : storedInstitucionNombre,
        codigoInvitacion: codigo,
        rol 
      };
      
      // DNI obligatorio en el sistema: validar en cliente
      if (!dni || !dni.trim()) {
        setValidationError('Debes ingresar tu DNI');
        notifyError('Debes ingresar tu DNI');
        setIsSubmitting(false);
        return;
      }
      payload.dni = dni.trim();
      
      console.log('📤 ENVIANDO AL SERVIDOR:', JSON.stringify(payload, null, 2));
      
      await handleAsync(() => ErrorHandler.handleFetch("http://localhost:3000/api/auth/registro/usuario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }, "No se pudo registrar."));
      
  notify('Usuario registrado exitosamente.');
      
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
      notifyError(formatError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSolicitudCodigo = async (e) => {
    e.preventDefault();
  clearError();
  clearMensaje();
    
    if (!email) {
      setValidationError("Debes ingresar tu correo electrónico");
      notifyError("Debes ingresar tu correo electrónico");
      return;
    }
    if (!nombre || !apellido) {
      setValidationError("Debes ingresar tu nombre y apellido");
      notifyError("Debes ingresar tu nombre y apellido");
      return;
    }
    if (!rol) {
      setValidationError("Debes seleccionar el rol");
      notifyError("Debes seleccionar el rol");
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
      notify('Solicitud enviada correctamente. El administrador te enviará el código por correo.');
    } catch (err) {
      notifyError(formatError(err));
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
          placeholder="DNI"
          value={dni}
          onChange={e => setDni(e.target.value)}
          style={{ marginTop: "1rem" }}
          disabled={isSubmitting}
          required
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
          <option value="jefe_area">Jefe de Área</option>
          <option value="estudiante">Estudiante</option>
        </select>
        {/* Nota: el endpoint /registro/usuario no acepta el rol 'estudiante'.
            Si quieres registrar un estudiante con código de invitación, usa
            el flujo unificado de registro (RegistroUnificado) que maneja
            los campos específicos de estudiante y envía al endpoint correcto. */}
        
        <input
          type="text"
          placeholder="Código de invitación"
          value={codigo}
          onChange={e => setCodigo(e.target.value)}
          required
          style={{ marginTop: "1rem" }}
          disabled={isSubmitting}
        />
        {/* Campos específicos para estudiantes: muestran si el rol seleccionado es 'estudiante' */}
        {rol === 'estudiante' && (
          <div className="registro-estudiante-fields">
            <select className={fieldErrors.anio ? 'field-error' : ''} value={anio} onChange={e => setAnio(e.target.value)} disabled={isSubmitting} required>
              <option value="">Año</option>
              {[1,2,3,4,5,6,7].map(a => (
                <option key={a} value={a}>{a}°</option>
              ))}
            </select>
            {fieldErrors.anio && <div className="error-text">{fieldErrors.anio}</div>}
            <select value={divisionEst} onChange={e => setDivisionEst(e.target.value)} disabled={isSubmitting} required>
              <option value="">División</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
            {fieldErrors.division && <div className="error-text">{fieldErrors.division}</div>}
            {showEspecialidadSelect ? (
              <>
                <select value={especialidad} onChange={e => setEspecialidad(e.target.value)} disabled={isSubmitting} required>
                  <option value="">Ciclo/Especialidad</option>
                  {especialidadesOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                {fieldErrors.especialidad && <div className="error-text">{fieldErrors.especialidad}</div>}
              </>
            ) : null}
            <input type="date" value={fechaNacimiento} onChange={e => setFechaNacimiento(e.target.value)} disabled={isSubmitting} required />
            {fieldErrors.fechaNacimiento && <div className="error-text">{fieldErrors.fechaNacimiento}</div>}
            {/* Mostrar advertencia si no hay institución detectada */}
            {(!institucionNombre && !localStorage.getItem('institucionId')) && (
              <div style={{ color: '#b33', marginTop: '0.5rem' }}>No se detectó la institución activa. Recarga la página o contacta al administrador.</div>
            )}
          </div>
        )}
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
              type="text"
              placeholder="DNI"
              value={dni}
              readOnly
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
      {showStudentModal && (
        <StudentModal idEstudiante={createdIdEstudiante} onClose={() => { setShowStudentModal(false); setCreatedIdEstudiante(null); }} />
      )}
  {/* NotificationManager is provided globally in main.jsx via NotificationProvider + NotificationManager */}
    </div>
  );
}

// Modal simple para mostrar idEstudiante
function StudentModal({ idEstudiante, onClose }) {
  if (!idEstudiante) return null;
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(idEstudiante);
      alert('ID del estudiante copiado al portapapeles');
    } catch {
      alert('No se pudo copiar');
    }
  };
  return (
    <div className="student-modal">
      <div className="student-modal-content">
        <h3>Registro exitoso</h3>
        <p>El ID del estudiante es: <strong>{idEstudiante}</strong></p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button onClick={handleCopy}>Copiar ID</button>
          <button onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export default Registro;