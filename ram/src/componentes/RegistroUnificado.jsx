import React, { useState, useEffect } from "react";
import BotonCerrar from "./BotonCerrar";
import ErrorHandler from "../utils/ErrorHandler";
import NotificationManager from "../utils/NotificationManager";
import "../estilos/colores.css";
import "../estilos/registroUnificado.css";
import "../estilos/mensajeBienvenida.css";

function RegistroUnificado({ setPantalla }) {
  const [paso, setPaso] = useState(1); // 1: Código, 2: Datos del usuario
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState("");
  
  // Datos del código de invitación
  const [codigoInvitacion, setCodigoInvitacion] = useState("");
  const [datosCodigoValido, setDatosCodigoValido] = useState(null);
  const [institucionInfo, setInstitucionInfo] = useState(null);

  // Datos del usuario
  const [usuario, setUsuario] = useState({
    nombre: "",
    apellido: "",
    email: "",
    dni: "",
    password: "",
    confirmarPassword: ""
  });

  // Datos específicos para estudiantes
  const [datosEstudiante, setDatosEstudiante] = useState({
    idEstudiante: "",
    fechaNacimiento: "",
    especialidad: "",
    año: "",
    division: ""
  });

  // Datos específicos para profesores/jefes de área
  const [datosProfesor, setDatosProfesor] = useState({
    ciclo: "",
    especialidad: "",
    materias: [{ materia: "", curso: "", division: "" }]
  });

  const [_especialidadesDisponibles, _setEspecialidadesDisponibles] = useState([]);
  const [_materiasDisponibles, _setMateriasDisponibles] = useState([[]]);

  // Cargar información de la institución
  useEffect(() => {
    const cargarInstitucion = async () => {
      try {
        const data = await ErrorHandler.handleFetch(
          "http://localhost:3000/api/instituciones",
          {},
          "Error cargando institución"
        );
        if (data.instituciones && data.instituciones.length > 0) {
          setInstitucionInfo(data.instituciones[0]);
        } else {
          console.warn("No se encontraron instituciones configuradas");
        }
      } catch (errorObj) {
        console.error("Error cargando institución:", errorObj);
        // No mostrar error al usuario, solo loguearlo
        // El registro puede continuar sin info de institución
      }
    };
    cargarInstitucion();
  }, []);

  const handleUsuarioChange = (e) => {
    setUsuario(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleEstudianteChange = (e) => {
    setDatosEstudiante(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleProfesorChange = (e) => {
    setDatosProfesor(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const validarCodigo = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const data = await ErrorHandler.handleFetch(
        "http://localhost:3000/api/auth/validar-codigo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo: codigoInvitacion })
        },
        "Código de invitación inválido"
      );
      
      setDatosCodigoValido(data);
      setMensaje(`Código válido para registro de ${getRolNombre(data.rol)}`);
      setTimeout(() => {
        setPaso(2);
        setMensaje("");
      }, 1500);
    } catch (errorObj) {
      setError(errorObj);
    } finally {
      setCargando(false);
    }
  };

  const registrarUsuario = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones comunes
    if (usuario.password !== usuario.confirmarPassword) {
      setError(ErrorHandler.processValidationError("Las contraseñas no coinciden"));
      return;
    }

    if (usuario.password.length < 6) {
      setError(ErrorHandler.processValidationError("La contraseña debe tener al menos 6 caracteres"));
      return;
    }

    setCargando(true);

    try {
      let datosRegistro = {
        ...usuario,
        codigoInvitacion,
        institucion: institucionInfo._id
      };

      // Agregar datos específicos según el rol
      if (datosCodigoValido.rol === "estudiante") {
        datosRegistro = {
          ...datosRegistro,
          ...datosEstudiante
        };
      } else {
        // Profesor o jefe de área
        datosRegistro = {
          ...datosRegistro,
          ciclo: datosProfesor.ciclo,
          especialidad: datosProfesor.ciclo === "segundo" ? datosProfesor.especialidad : "",
          cursosACargo: datosProfesor.materias.map(m => ({
            materia: m.materia,
            curso: m.curso,
            division: m.division,
            especialidad: datosProfesor.ciclo === "segundo" ? datosProfesor.especialidad : ""
          }))
        };
      }

      const endpoint = datosCodigoValido.rol === "estudiante" 
        ? "/api/auth/registro/estudiante"
        : "/api/auth/registro/usuario";

      await ErrorHandler.handleFetch(
        `http://localhost:3000${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(datosRegistro)
        },
        "Error al registrar usuario"
      );
      
      setMensaje("¡Registro exitoso! Redirigiendo al login...");
      setTimeout(() => {
        setPantalla && setPantalla("login");
      }, 2000);
    } catch (errorObj) {
      setError(errorObj);
    } finally {
      setCargando(false);
    }
  };

  const getRolNombre = (rol) => {
    const roles = {
      'profesor': 'Profesor',
      'jefe_area': 'Jefe de Área',
      'estudiante': 'Estudiante'
    };
    return roles[rol] || rol;
  };

  const agregarMateria = () => {
    setDatosProfesor(prev => ({
      ...prev,
      materias: [...prev.materias, { materia: "", curso: "", division: "" }]
    }));
  };

  const eliminarMateria = (idx) => {
    setDatosProfesor(prev => ({
      ...prev,
      materias: prev.materias.filter((_, i) => i !== idx)
    }));
  };

  const handleMateriaChange = (idx, field, value) => {
    const nuevasMaterias = datosProfesor.materias.map((m, i) => 
      i === idx ? { ...m, [field]: value } : m
    );
    setDatosProfesor(prev => ({
      ...prev,
      materias: nuevasMaterias
    }));
  };

  return (
    <div className="registro-unificado-container">
      <BotonCerrar onClick={() => setPantalla && setPantalla("login")} />
      
      <h2 className="registro-unificado-titulo">Registro de Usuario</h2>
      
      {institucionInfo && (
        <div className="mensaje-bienvenida">
          <p className="mensaje-bienvenida-titulo">
            Sistema de Registro
          </p>
          <p className="mensaje-bienvenida-institucion">
            Institución: {institucionInfo.nombre}
          </p>
        </div>
      )}

      <div className="registro-progress">
        <div className={`registro-paso ${paso >= 1 ? 'activo' : ''}`}>
          <span className="registro-paso-numero">1</span>
          <span className="registro-paso-texto">Código de Invitación</span>
        </div>
        <div className={`registro-paso ${paso >= 2 ? 'activo' : ''}`}>
          <span className="registro-paso-numero">2</span>
          <span className="registro-paso-texto">Datos Personales</span>
        </div>
      </div>

      {paso === 1 && (
        <form onSubmit={validarCodigo} className="registro-form">
          <h3>Ingrese su código de invitación</h3>
          <p className="codigo-info">
            Solicite un código de invitación al administrador del sistema para poder registrarse.
          </p>
          
          <label>
            Código de Invitación *
            <input
              type="text"
              value={codigoInvitacion}
              onChange={(e) => setCodigoInvitacion(e.target.value.toUpperCase())}
              placeholder="Ej: ABC123DEF"
              required
              maxLength="9"
              style={{ 
                textAlign: "center", 
                fontFamily: "monospace", 
                fontSize: "1.2rem",
                letterSpacing: "2px"
              }}
            />
          </label>

          <button type="submit" disabled={cargando} className="registro-btn-primary">
            {cargando ? "Validando..." : "Validar Código"}
          </button>
        </form>
      )}

      {paso === 2 && datosCodigoValido && (
        <form onSubmit={registrarUsuario} className="registro-form">
          <h3>Datos para {getRolNombre(datosCodigoValido.rol)}</h3>
          
          {/* Datos comunes para todos los usuarios */}
          <div className="registro-row">
            <label>
              Nombre *
              <input
                type="text"
                name="nombre"
                value={usuario.nombre}
                onChange={handleUsuarioChange}
                required
              />
            </label>
            <label>
              Apellido *
              <input
                type="text"
                name="apellido"
                value={usuario.apellido}
                onChange={handleUsuarioChange}
                required
              />
            </label>
          </div>

          <div className="registro-row">
            <label>
              Email *
              <input
                type="email"
                name="email"
                value={usuario.email}
                onChange={handleUsuarioChange}
                required
              />
            </label>
            <label>
              DNI *
              <input
                type="text"
                name="dni"
                value={usuario.dni}
                onChange={handleUsuarioChange}
                required
              />
            </label>
          </div>

          <div className="registro-row">
            <label>
              Contraseña *
              <input
                type="password"
                name="password"
                value={usuario.password}
                onChange={handleUsuarioChange}
                minLength="6"
                required
              />
            </label>
            <label>
              Confirmar Contraseña *
              <input
                type="password"
                name="confirmarPassword"
                value={usuario.confirmarPassword}
                onChange={handleUsuarioChange}
                minLength="6"
                required
              />
            </label>
          </div>

          {/* Campos específicos para estudiantes */}
          {datosCodigoValido.rol === "estudiante" && (
            <>
              <div className="registro-row">
                <label>
                  ID de Estudiante *
                  <input
                    type="text"
                    name="idEstudiante"
                    value={datosEstudiante.idEstudiante}
                    onChange={handleEstudianteChange}
                    placeholder="Ej: EST001"
                    required
                  />
                </label>
                <label>
                  Fecha de Nacimiento *
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={datosEstudiante.fechaNacimiento}
                    onChange={handleEstudianteChange}
                    required
                  />
                </label>
              </div>

              <div className="registro-row">
                <label>
                  Especialidad *
                  <select
                    name="especialidad"
                    value={datosEstudiante.especialidad}
                    onChange={handleEstudianteChange}
                    required
                  >
                    <option value="">Seleccione especialidad</option>
                    <option value="CBU">CBU</option>
                    <option value="Electricidad">Electricidad</option>
                    <option value="Programación">Programación</option>
                  </select>
                </label>
                <label>
                  Año *
                  <select
                    name="año"
                    value={datosEstudiante.año}
                    onChange={handleEstudianteChange}
                    required
                  >
                    <option value="">Seleccione año</option>
                    {[1,2,3,4,5,6,7].map(año => (
                      <option key={año} value={año}>{año}°</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="registro-row">
                <label>
                  División *
                  <select
                    name="division"
                    value={datosEstudiante.division}
                    onChange={handleEstudianteChange}
                    required
                  >
                    <option value="">Seleccione división</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </label>
              </div>
            </>
          )}

          {/* Campos específicos para profesores/jefes de área */}
          {(datosCodigoValido.rol === "profesor" || datosCodigoValido.rol === "jefe_area") && (
            <>
              <div className="registro-row">
                <label>
                  Ciclo *
                  <select
                    name="ciclo"
                    value={datosProfesor.ciclo}
                    onChange={handleProfesorChange}
                    required
                  >
                    <option value="">Seleccione ciclo</option>
                    <option value="cbu">CBU - Primer Ciclo (1°, 2°, 3° año)</option>
                    <option value="segundo">Segundo Ciclo (4°, 5°, 6°, 7° año)</option>
                  </select>
                </label>
                
                {datosProfesor.ciclo === "segundo" && (
                  <label>
                    Especialidad *
                    <select
                      name="especialidad"
                      value={datosProfesor.especialidad}
                      onChange={handleProfesorChange}
                      required
                    >
                      <option value="">Seleccione especialidad</option>
                      <option value="PROGRAMACION">PROGRAMACIÓN</option>
                      <option value="ELECTRICIDAD">ELECTRICIDAD</option>
                    </select>
                  </label>
                )}
              </div>

              <div className="materias-section">
                <label>Materias a cargo *</label>
                <p className="materias-info">
                  Indique las materias, cursos y divisiones que tiene asignados.
                </p>
                {datosProfesor.materias.map((materia, idx) => (
                  <div key={idx} className="materia-row">
                    <input
                      type="text"
                      placeholder="Nombre de la materia"
                      value={materia.materia}
                      onChange={(e) => handleMateriaChange(idx, "materia", e.target.value)}
                      required
                    />
                    <select
                      value={materia.curso}
                      onChange={(e) => handleMateriaChange(idx, "curso", e.target.value)}
                      required
                    >
                      <option value="">Curso</option>
                      {datosProfesor.ciclo === "cbu" ? (
                        [1,2,3].map(curso => (
                          <option key={curso} value={curso}>{curso}°</option>
                        ))
                      ) : datosProfesor.ciclo === "segundo" ? (
                        [4,5,6,7].map(curso => (
                          <option key={curso} value={curso}>{curso}°</option>
                        ))
                      ) : (
                        [1,2,3,4,5,6,7].map(curso => (
                          <option key={curso} value={curso}>{curso}°</option>
                        ))
                      )}
                    </select>
                    <select
                      value={materia.division}
                      onChange={(e) => handleMateriaChange(idx, "division", e.target.value)}
                      required
                    >
                      <option value="">División</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </select>
                    {datosProfesor.materias.length > 1 && (
                      <button
                        type="button"
                        onClick={() => eliminarMateria(idx)}
                        className="btn-eliminar-materia"
                        title="Eliminar materia"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  type="button" 
                  onClick={agregarMateria}
                  className="btn-agregar-materia"
                >
                  + Agregar Materia
                </button>
              </div>
            </>
          )}

          <div className="registro-buttons">
            <button 
              type="button" 
              onClick={() => setPaso(1)}
              className="registro-btn-secondary"
            >
              Volver
            </button>
            <button type="submit" disabled={cargando} className="registro-btn-primary">
              {cargando ? "Registrando..." : "Completar Registro"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="registro-error">{error}</p>}
      {mensaje && <p className="registro-mensaje">{mensaje}</p>}
      
      <NotificationManager 
        error={error}
        mensaje={mensaje}
        onClearError={() => setError(null)}
        onClearMensaje={() => setMensaje("")}
      />
    </div>
  );
}

export default RegistroUnificado;