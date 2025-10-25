import { useState, useEffect } from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import { loginSchema, recuperoSchema } from "../utils/validatorYup";
import NotificationManager from "../utils/NotificationManager";
import { useNotification } from '../hooks/useNotification';
import BotonCerrar from "../componentes/BotonCerrar";
import InstitucionBanner from "../componentes/Institucion_Banner";
import "../estilos/colores.css";
import "../estilos/login.css";

function Login({ onLogin, setPantalla }) {
  const [dniLogin, setDniLogin] = useState("");
  const [password, setPassword] = useState("");
  const { notify, notifyError, clearMensaje } = useNotification();
  const [recupero, setRecupero] = useState(false);
  const [recuperoEmail, setRecuperoEmail] = useState("");
  const [institucionNombre, setInstitucionNombre] = useState("");
  
  const institucionId = localStorage.getItem("institucionId") || "";
  const { clearError, handleAsync, setValidationError, formatError } = useErrorHandler();

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
  clearMensaje();
    try {
      await recuperoSchema.validate({ email: recuperoEmail });
    } catch (validationError) {
      setValidationError(validationError.message);
      notifyError(validationError.message);
      return;
    }
    try {
      await handleAsync(() => ErrorHandler.handleFetch("http://localhost:3000/api/auth/recuperar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: recuperoEmail }),
      }, "No se pudo enviar el correo."));
      notify('Si el correo está registrado, recibirás instrucciones.');
    } catch (err) {
      notifyError(formatError(err));
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  clearError();
  clearMensaje();

  try {
    // Sanitize DNI: eliminar espacios, guiones y otros caracteres no numéricos
    const dniClean = String(dniLogin || '').replace(/\D/g, '');
    await loginSchema.validate({ dni: dniClean, password });
  } catch (validationError) {
    setValidationError(validationError.message);
    notifyError(validationError.message);
    return;
  }

  try {
    // Antes de llamar al endpoint de usuario, comprobamos si el DNI corresponde a un Estudiante
    const dniClean = String(dniLogin || '').replace(/\D/g, '');

    let data = null;

    try {
      const posibleEstudiante = await handleAsync(() =>
        ErrorHandler.handleFetch(
          `http://localhost:3000/api/estudiantes?dni=${encodeURIComponent(dniClean)}&institucionId=${encodeURIComponent(institucionId)}`,
          { method: "GET" },
          "Error al buscar estudiante"
        )
      );

      // posibleEstudiante puede venir como { estudiantes: [...] } o como array, manejar ambos casos
      const lista = Array.isArray(posibleEstudiante)
        ? posibleEstudiante
        : (posibleEstudiante && posibleEstudiante.estudiantes) || [];

      if (Array.isArray(lista) && lista.length > 0) {
        // Encontramos un estudiante: usamos el endpoint específico para estudiantes
        const estudiante = lista[0];
        // Preferir el campo idEstudiante (campo único del modelo). Si no está presente,
        // usar _id como fallback.
        const idEst = estudiante.idEstudiante || estudiante._id || estudiante.id;
        data = await handleAsync(() =>
          ErrorHandler.handleFetch(
            "http://localhost:3000/api/auth/login/estudiante",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ idEstudiante: idEst, password })
            },
            "Credenciales inválidas (estudiante)"
          )
        );
      }
    } catch (estErr) {
      // Si falla la búsqueda del estudiante, ignoramos y seguimos con el flujo normal de login de usuario
      console.warn("No se pudo comprobar si es estudiante, se intentará login de usuario:", estErr);
    }

    // Si no se resolvió `data` por la rama estudiante, intentamos el login estándar de usuario
    if (!data) {
      data = await handleAsync(() =>
        ErrorHandler.handleFetch(
          "http://localhost:3000/api/auth/login/usuario",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // Enviar DNI sanitizado para evitar errores del validador en el servidor
            body: JSON.stringify({ dni: dniClean, password, institucion: institucionId })
          },
          "Credenciales inválidas o usuario no pertenece a la institución"
        )
      );
    }

    // DEBUG opcional: ver forma de la respuesta durante pruebas
  console.log("Login response:", data);

    // Guardar token (si viene)
    const token = data.token || data.accessToken || "";
    if (token) localStorage.setItem("token", token);

    // Si el backend respondió con tipo 'estudiante' o con el objeto `estudiante`, guardamos sus datos
    if (data.tipo === 'estudiante' || data.estudiante) {
      const est = data.estudiante || data.est;
      if (est) {
        // Guardar id
        const studentId = est.id || est._id || est.idEstudiante || null;
        if (studentId) localStorage.setItem('userId', studentId.toString());
        // Nombre
        const nombreCompletoEst = est.nombre || est.nombreCompleto || est.nombreCompleto || '';
        if (nombreCompletoEst) {
          const parts = nombreCompletoEst.trim().split(/\s+/);
          const primerNombre = parts.shift() || nombreCompletoEst;
          const resto = parts.join(' ') || '';
          localStorage.setItem('nombre', primerNombre);
          localStorage.setItem('apellido', resto);
          localStorage.setItem('nombreCompleto', nombreCompletoEst);
        }
        // Rol y campos de estudiante
        localStorage.setItem('rol', 'estudiante');
        if (est.especialidad) localStorage.setItem('especialidad', est.especialidad);
        if (est.año) localStorage.setItem('año', String(est.año));
        if (est.division) localStorage.setItem('division', est.division);
        if (est.institucion && (est.institucion.id || est.institucion._id || est.institucion)) {
          const instId = typeof est.institucion === 'string' ? est.institucion : (est.institucion.id || est.institucion._id);
          if (instId) localStorage.setItem('institucionId', instId.toString());
          const instNombre = est.institucion.nombre || est.institucionNombre || '';
          if (instNombre) localStorage.setItem('institucionNombre', instNombre);
        }
      }
    }

    // Intentar usar el objeto usuario que envía el backend (loginController devuelve `usuario`)
    const usuario = data.usuario || data.user || null;

    if (usuario) {
      // userId
      const userId = usuario.id || usuario._id || usuario.userId || null;
      if (userId) localStorage.setItem("userId", userId.toString());

      // nombre: el backend suele enviar `usuario.nombre` como nombre completo; intentamos separar nombre/apellido
      const nombreCompleto = usuario.nombre || usuario.nombreCompleto || "";
      if (nombreCompleto) {
        const parts = nombreCompleto.trim().split(/\s+/);
        const primerNombre = parts.shift() || nombreCompleto;
        const resto = parts.join(" ") || "";
        localStorage.setItem("nombre", primerNombre);
        localStorage.setItem("apellido", resto);
        localStorage.setItem("nombreCompleto", nombreCompleto);
      } else {
        if (usuario.nombre) localStorage.setItem("nombre", usuario.nombre);
        if (usuario.apellido) localStorage.setItem("apellido", usuario.apellido);
      }

      // rol
      if (usuario.rol) localStorage.setItem("rol", usuario.rol);

      // institucion (puede venir como id o como objeto)
      if (usuario.institucion) {
        const instId = typeof usuario.institucion === "string"
          ? usuario.institucion
          : (usuario.institucion.id || usuario.institucion._id);
        if (instId) localStorage.setItem("institucionId", instId.toString());
        const instNombre = usuario.institucion.nombre || usuario.institucionNombre;
        if (instNombre) localStorage.setItem("institucionNombre", instNombre);
      }

      // materias (guardar sólo los ids si vienen)
      if (Array.isArray(usuario.materias)) {
        const materiaIds = usuario.materias.map(m => (m._id || m.id || m).toString());
        localStorage.setItem("materias", JSON.stringify(materiaIds));
      }
    } else {
      // Fallback: si el login no devolvió `usuario`, usar los campos sueltos que trae la respuesta
      if (data.userId) localStorage.setItem("userId", data.userId);
      if (data.rol) localStorage.setItem("rol", data.rol);
      if (data.nombre) {
        // data.nombre podría ser nombre completo: intentamos separar
        const parts = (data.nombre || "").trim().split(/\s+/);
        const primerNombre = parts.shift() || data.nombre;
        const resto = parts.join(" ") || "";
        localStorage.setItem("nombre", primerNombre);
        localStorage.setItem("apellido", resto);
        localStorage.setItem("nombreCompleto", data.nombre);
      }
    }

    // Callback y redirección: mantiene comportamiento actual
    const rolGuardado = localStorage.getItem("rol") || data.rol || "usuario";
    if (onLogin) onLogin(rolGuardado, token, localStorage.getItem("nombre") || "");
    setPantalla && setPantalla("dashboard");

  } catch (err) {
    notifyError(formatError(err));
  }
};

  return (
    <div className="login-page-bg">
      <InstitucionBanner nombreInstitucion={institucionNombre} />
      <div className="login-logo-fixed">
        <img src="/logoRAM.png" alt="Logo RAM" style={{ width: "180px", maxWidth: "40vw" }} />
      </div>
      <div className="login-container lateral">
        <BotonCerrar onClick={() => setPantalla && setPantalla("presentacion")} />
        <h2>Iniciar sesión</h2>
        {!recupero ? (
          <>
            <form onSubmit={handleSubmit} className="login-form">
              <input
                type="text"
                placeholder="DNI"
                value={dniLogin}
                onChange={e => setDniLogin(e.target.value)}
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
          onClearError={() => { if (typeof clearError === 'function') clearError(); }}
          onClearMensaje={() => { if (typeof clearMensaje === 'function') clearMensaje(); }}
          autoHide={true}
          hideDelay={3500}
        />
      </div>
    </div>
  );
}

export default Login;