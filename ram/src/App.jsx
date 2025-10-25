import { useState, useEffect } from "react";
import Dashboard from "./paginas/Dashboard";
import ProfesorDashboard from "./componentes/ProfesorDashboard";
import EstudianteAutoevaluacion from "./componentes/EstudianteAutoevaluacion";
import RegistroInstitucion from "./componentes/RegistroInstitucion";
import Login from "./paginas/Login";
import Setup from "./paginas/Setup";
import RegistroUnificado from "./componentes/RegistroUnificado";
import ErrorBoundary from "./componentes/ErrorBoundary";
import Recuperar from "./componentes/Recuperar";
import Registro from "./paginas/Registro";
import ListaUsuarios from "./componentes/ListaUsuarios";

import './App.css'

function App() {
  const [pantalla, setPantalla] = useState("verificando");
  const [_necesitaSetup, setNecesitaSetup] = useState(false);

  // Verificar si el sistema necesita configuración inicial
  useEffect(() => {
    const verificarSetup = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/setup/verificar");
        const data = await res.json();
        
        console.log('Verificación de setup:', data); // Debug
        
        if (res.ok) {
          setNecesitaSetup(data.necesitaSetup);
          if (data.necesitaSetup) {
            console.log('Sistema necesita configuración inicial');
            setPantalla("setup");
          } else {
            console.log('Sistema ya configurado, ir a presentación');
            setPantalla("presentacion");
          }
        } else {
          console.error('Error en verificación de setup:', data);
          // Si hay error, asumir que necesita setup
          setNecesitaSetup(true);
          setPantalla("setup");
        }
      } catch (error) {
        console.error("Error verificando setup:", error);
        // Si hay error de conexión, ir a presentación por defecto
        setPantalla("presentacion");
      }
    };

    verificarSetup();
  }, []);
  // Agregar después de verificarSetup (línea 52)
useEffect(() => {
  const verificarSetup = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/setup/verificar");
      const data = await res.json();
      
      if (res.ok) {
        setNecesitaSetup(data.necesitaSetup);
        if (data.necesitaSetup) {
          setPantalla("setup");
        } else {
          // AGREGAR ESTA PARTE: Cargar institución activa
          await cargarInstitucionActiva();
          setPantalla("presentacion");
        }
      } else {
        setNecesitaSetup(true);
        setPantalla("setup");
      }
    } catch (error) {
      console.error("Error verificando setup:", error);
      setPantalla("presentacion");
    }
  };

  // NUEVA FUNCIÓN: Cargar institución activa
  const cargarInstitucionActiva = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/instituciones/activa");
        const data = await res.json();
        
        if (res.ok && data.institucion) {
          localStorage.setItem("institucionId", data.institucion._id);
          localStorage.setItem("institucionNombre", data.institucion.nombre);
          console.log("Institución cargada:", data.institucion.nombre);
        }
      } catch (error) {
        console.error("Error cargando institución:", error);
      }
    };

    verificarSetup();
  }, []);
  // Función para manejar login exitoso
  const handleLogin = (rol, token, nombre) => {
    localStorage.setItem("token", token);
    localStorage.setItem("rol", rol);
    if (nombre) localStorage.setItem("nombre", nombre);
    
    // Redirigir según el rol del usuario
    switch(rol) {
      case 'administrador':
        setPantalla("dashboard"); // Dashboard completo para administrador
        break;
      case 'profesor':
        setPantalla("profesorDashboard"); // Vista específica para profesores
        break;
      case 'estudiante':
        setPantalla("estudianteAutoevaluacion"); // Autoevaluación para estudiantes
        break;
      default:
        setPantalla("dashboard"); // Por defecto ir al dashboard
    }
  };

  // Función para cuando se completa el setup inicial
  const handleSetupComplete = () => {
    setNecesitaSetup(false);
    setPantalla("presentacion");
  };

  return (
    <div>
      {pantalla === "verificando" && (
        <div className="verificando-bg">
          <img src="/logoRAM.png" alt="Logo RAM" className="presentacion-logo" />
          <p className="verificando-texto">Verificando configuración del sistema...</p>
        </div>
      )}
      
      {pantalla === "setup" && (
        <ErrorBoundary>
          <Setup onSetupComplete={handleSetupComplete} />
        </ErrorBoundary>
      )}
      
      {pantalla === "presentacion" && (
        <div className="presentacion-bg presentacion-flex">
          <img src="/logoRAM.png" alt="Logo RAM" className="presentacion-logo presentacion-logo-bienvenida" />
          <h1 className="presentacion-titulo">
            Bienvenido al Sistema R.A.M.
          </h1>
          <button 
            className="presentacion-btn presentacion-btn-bienvenida"
            onClick={() => setPantalla("login")}
          >
            Iniciar sesión
          </button>
        </div>
      )}
      
      {pantalla === "login" && (
        <ErrorBoundary>
          <Login setPantalla={setPantalla} onLogin={handleLogin} />
        </ErrorBoundary>
      )}
      
      {pantalla === "recuperar" && <Recuperar setPantalla={setPantalla} />}
      {pantalla === "registro" && <Registro setPantalla={setPantalla} />}
      {pantalla === "registroUnificado" && <RegistroUnificado setPantalla={setPantalla} />}
      {pantalla === "dashboard" && <Dashboard setPantalla={setPantalla} />}
      {pantalla === "profesorDashboard" && <ProfesorDashboard setPantalla={setPantalla} />}
      {pantalla === "estudianteAutoevaluacion" && <EstudianteAutoevaluacion setPantalla={setPantalla} />}
      {pantalla === "registroInstitucion" && <RegistroInstitucion setPantalla={setPantalla} />}
      {pantalla === "listaUsuarios" && <ListaUsuarios setPantalla={setPantalla} />}
      {/* Agrega aquí otras pantallas si lo necesitas */}
    </div>
  );
}

export default App
