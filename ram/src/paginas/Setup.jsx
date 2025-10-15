import React, { useState } from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import SetupInstitucion from "../componentes/SetupInstitucion";
import SetupAdmin from "../componentes/SetupAdmin";
import NotificationManager from "../utils/NotificationManager";
import "../estilos/SetupGeneral.css";
import "../estilos/SetupProgress.css";
// import { institucionSchema, administradorSchema } from "../utils/validatorYup";


function Setup({ onSetupComplete }) {
  const [paso, setPaso] = useState(1); // 1: Institución, 2: Administrador
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  // ErrorHandler hook
  const { error, clearError } = useErrorHandler();

  // Datos de la institución
  const [institucion, setInstitucion] = useState({
    nombre: "",
    codigo: "",
    contacto: {
      email: "",
      sitioWeb: ""
    },
    modalidad: "tecnica",
    ciclos: []
  });

  // Tipos de institución
  const [tipoInstitucion, setTipoInstitucion] = useState('tecnica');

  // Especialidades técnicas y orientaciones
  const [especialidadesDisponibles, setEspecialidadesDisponibles] = useState([
    { id: 'electricidad', nombre: 'Electricidad' },
    { id: 'programacion', nombre: 'Programación' },
    { id: 'mecanica', nombre: 'Mecánica' },
    { id: 'electronica', nombre: 'Electrónica' },
    { id: 'construcciones', nombre: 'Construcciones' },
    { id: 'quimica', nombre: 'Química' },
    { id: 'automotores', nombre: 'Automotores' }
  ]);
  const [orientacionesDisponibles, setOrientacionesDisponibles] = useState([
    { id: 'ciencias_sociales', nombre: 'Ciencias Sociales' },
    { id: 'humanidades', nombre: 'Humanidades' },
    { id: 'economia', nombre: 'Economía' },
    { id: 'naturales', nombre: 'Ciencias Naturales' },
    { id: 'arte', nombre: 'Arte' }
  ]);

  // Años disponibles para especialidades técnicas y orientaciones
  const añosEspecialidad = ['4to', '5to', '6to', '7mo'];
  const añosOrientacion = ['4to', '5to', '6to'];

  // Datos del administrador
  const [administrador, setAdministrador] = useState({
    nombre: "",
    apellido: "",
    email: "",
    dni: "",
    password: "",
    confirmarPassword: ""
  });

  const [erroresCampos, setErroresCampos] = useState({});
  const [nuevaEspecialidad, setNuevaEspecialidad] = useState("");

  return (
    <div className="setup-inicial-container">
      <div className="setup-inicial-card">
        <h1 className="setup-inicial-titulo">
          Configuración Inicial del Sistema R.A.M.
        </h1>
        <div className="setup-inicial-progress">
          <div className={`setup-paso ${paso >= 1 ? 'activo' : ''}`}>
            <span className="setup-paso-numero">1</span>
            <span className="setup-paso-texto">Institución</span>
          </div>
          <div className={`setup-paso ${paso >= 2 ? 'activo' : ''}`}>
            <span className="setup-paso-numero">2</span>
            <span className="setup-paso-texto">Administrador</span>
          </div>
        </div>
        {paso === 1 && (
          <SetupInstitucion
            institucion={institucion}
            setInstitucion={setInstitucion}
            tipoInstitucion={tipoInstitucion}
            setTipoInstitucion={setTipoInstitucion}
            especialidadesDisponibles={especialidadesDisponibles}
            setEspecialidadesDisponibles={setEspecialidadesDisponibles}
            orientacionesDisponibles={orientacionesDisponibles}
            setOrientacionesDisponibles={setOrientacionesDisponibles}
            añosEspecialidad={añosEspecialidad}
            añosOrientacion={añosOrientacion}
            nuevaEspecialidad={nuevaEspecialidad}
            setNuevaEspecialidad={setNuevaEspecialidad}
            erroresCampos={erroresCampos}
            setErroresCampos={setErroresCampos}
            setPaso={setPaso}
            setMensaje={setMensaje}
            cargando={cargando}
            setCargando={setCargando}
          />
        )}
        {paso === 2 && (
          <SetupAdmin
            administrador={administrador}
            setAdministrador={setAdministrador}
            erroresCampos={erroresCampos}
            setErroresCampos={setErroresCampos}
            setPaso={setPaso}
            setMensaje={setMensaje}
            cargando={cargando}
            setCargando={setCargando}
            onSetupComplete={onSetupComplete}
          />
        )}
  {/* Mensajes inline eliminados, solo NotificationManager */}
      </div>
      <NotificationManager 
        error={error}
        mensaje={mensaje}
        onClearError={clearError}
        onClearMensaje={() => setMensaje("")}
      />
    </div>
  );
}

export default Setup;
