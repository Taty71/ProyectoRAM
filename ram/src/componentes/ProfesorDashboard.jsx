import React, { useState, useEffect } from "react";
import InformesEstadisticos from "./InformesEstadisticos";
import "../estilos/colores.css";
import "../estilos/dashboard.css";
import logo from "../assets/logo-ram.png";

function ProfesorDashboard({ setPantalla }) {
  const [pantallaLocal, setPantallaLocal] = useState("dashboard");
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);

  // Obtener datos del profesor
  const nombre = localStorage.getItem("nombre") || "Profesor";
  const rol = localStorage.getItem("rol") || "profesor";
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.clear();
    setPantalla && setPantalla("login");
  };

  // Cargar materias del profesor
  useEffect(() => {
    const cargarMaterias = async () => {
      if (!userId || !token) return;
      
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:3000/api/profesor/materias/${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          setMaterias(data.materias || []);
        } else {
          console.error('Error cargando materias');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    cargarMaterias();
  }, [userId, token]);

  const renderDashboard = () => (
    <div className="workflow-grid">
      <div className="profesor-info">
        <h3>🧑‍🏫 Panel del Profesor</h3>
        <p>Gestiona tus materias y revisa las autoevaluaciones de tus estudiantes</p>
      </div>
      
      <button 
        className="workflow-step prof" 
        onClick={() => setPantallaLocal("gestionMaterias")}
        style={{ cursor: "pointer" }}>
        📚 Gestionar mis materias
      </button>
      
      <button 
        className="workflow-step prof" 
        onClick={() => setPantallaLocal("verEvaluaciones")}
        style={{ cursor: "pointer" }}>
        📊 Ver autoevaluaciones de estudiantes
      </button>
      
      <button 
        className="workflow-step prof" 
        onClick={() => setPantallaLocal("reportes")}
        style={{ cursor: "pointer" }}>
        📈 Reportes y estadísticas
      </button>
      
      <div className="materias-resumen">
        <h4>Mis materias:</h4>
        {loading ? (
          <p>Cargando materias...</p>
        ) : materias.length > 0 ? (
          <ul>
            {materias.map((materia, index) => (
              <li key={index} style={{ padding: '0.5rem', background: '#f8f9fa', margin: '0.25rem 0', borderRadius: '4px' }}>
                <strong>{materia.nombre}</strong> - Curso: {materia.curso} - Ciclo: {materia.ciclo}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#6c757d' }}>No tienes materias asignadas aún.</p>
        )}
      </div>
    </div>
  );

  const renderGestionMaterias = () => (
    <div className="gestion-materias">
      <button onClick={() => setPantallaLocal("dashboard")} className="btn-volver">
        ← Volver al panel principal
      </button>
      <h3>📚 Gestión de Materias</h3>
      <p>Aquí podrás solicitar asignación de materias y gestionar tus cursos.</p>
      
      <div className="form-container">
        <h4>Solicitar asignación de materia</h4>
        <form>
          <input type="text" placeholder="Nombre de la materia" required />
          <select required>
            <option value="">Seleccionar curso</option>
            <option value="1">1er año</option>
            <option value="2">2do año</option>
            <option value="3">3er año</option>
            <option value="4">4to año</option>
            <option value="5">5to año</option>
            <option value="6">6to año</option>
          </select>
          <select required>
            <option value="">Seleccionar división</option>
            <option value="A">División A</option>
            <option value="B">División B</option>
            <option value="C">División C</option>
          </select>
          <select required>
            <option value="">Seleccionar ciclo</option>
            <option value="CB">Ciclo Básico</option>
            <option value="CS">Ciclo Superior</option>
          </select>
          <button type="submit" className="btn-primary">Solicitar asignación</button>
        </form>
      </div>
    </div>
  );

  const renderEvaluaciones = () => (
    <div className="ver-evaluaciones">
      <button onClick={() => setPantallaLocal("dashboard")} className="btn-volver">
        ← Volver al panel principal
      </button>
      <h3>📊 Autoevaluaciones de Estudiantes</h3>
      <p>Revisa las autoevaluaciones realizadas por tus estudiantes.</p>
      
      <div className="filtros-evaluaciones">
        <select>
          <option value="">Todas las materias</option>
          {materias.map((materia, index) => (
            <option key={index} value={materia._id}>{materia.nombre}</option>
          ))}
        </select>
        <select>
          <option value="">Todos los cursos</option>
          <option value="1">1er año</option>
          <option value="2">2do año</option>
          <option value="3">3er año</option>
          <option value="4">4to año</option>
          <option value="5">5to año</option>
          <option value="6">6to año</option>
        </select>
      </div>
      
      <div className="evaluaciones-lista">
        <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
          No hay evaluaciones disponibles aún. Los estudiantes comenzarán a enviar sus autoevaluaciones pronto.
        </p>
      </div>
    </div>
  );

  const renderReportes = () => (
    <div className="reportes">
      <button onClick={() => setPantallaLocal("dashboard")} className="btn-volver">
        ← Volver al panel principal
      </button>
      <InformesEstadisticos rol="profesor" profesorId={userId} />
    </div>
  );

  return (
    <div className="dashboard-container">
      <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
        &#x2716; Cerrar sesión
      </button>
      <img src={logo} alt="Logo RAM" className="logo-ram" />
      <h1>R.A.M. - Panel del Profesor</h1>
      <p className="slogan">Gestiona tus materias y evalúa el progreso estudiantil</p>
      
      <div className="dashboard-bienvenida">
        <span>Bienvenido/a, <strong>{nombre}</strong> ({rol})</span>
      </div>

      {pantallaLocal === "dashboard" && renderDashboard()}
      {pantallaLocal === "gestionMaterias" && renderGestionMaterias()}
      {pantallaLocal === "verEvaluaciones" && renderEvaluaciones()}
      {pantallaLocal === "reportes" && renderReportes()}
    </div>
  );
}

export default ProfesorDashboard;