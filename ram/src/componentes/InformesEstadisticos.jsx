import React, { useState, useEffect, useCallback } from "react";
import "../estilos/colores.css";
import "../estilos/dashboard.css";
import "../estilos/informes.css";

function InformesEstadisticos({ rol = "administrador", profesorId = null }) {
  // HOOK useState: Gestiona el estado local del componente
  // Cada useState retorna [valor, funcionParaActualizarValor]
  
  // Estados para controlar la UI y los datos del componente
  const [tipoInforme, setTipoInforme] = useState("resumen"); // Tipo de informe seleccionado (resumen, materias, comentarios)
  const [filtros, setFiltros] = useState({
    curso: "",
    division: "",
    materia: "",
    fechaInicio: "",
    fechaFin: ""
  }); // Estado para almacenar los filtros aplicados a los informes
  
  // Estado para almacenar los datos de los informes recibidos del servidor
  const [datos, setDatos] = useState({
    resumenGeneral: {
      totalEvaluaciones: 0,
      promedioComprension: 0,
      promedioParticipacion: 0,
      promedioDificultad: 0,
      promedioMotivacion: 0
    },
    estadisticasPorMateria: [],
    tendencias: [],
    comentarios: []
  });
  
  const [loading, setLoading] = useState(false); // Estado para mostrar indicador de carga

  const token = localStorage.getItem("token"); // Token de autenticación del usuario

  // HOOK useCallback: Memoriza la función cargarDatos para evitar recreaciones innecesarias
  // Se ejecuta solo cuando cambian las dependencias especificadas en el array
  // Esto optimiza el rendimiento y evita bucles infinitos en useEffect
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    try {
      let url = `http://localhost:3000/api/informes/${tipoInforme}`;
      
      // Si es profesor, filtrar por sus materias
      if (rol === "profesor" && profesorId) {
        url += `?profesorId=${profesorId}`;
      }
      
      // Agregar filtros adicionales
      const params = new URLSearchParams();
      Object.entries(filtros).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      
      if (params.toString()) {
        url += (url.includes('?') ? '&' : '?') + params.toString();
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setDatos(data);
      } else {
        console.error('Error cargando datos de informes');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [tipoInforme, filtros, rol, profesorId, token]); // Dependencias: la función se recrea solo si alguna de estas cambia

  // HOOK useEffect: Se ejecuta después del renderizado cuando cambia cargarDatos
  // Como cargarDatos está memorizada con useCallback, este effect solo se ejecuta
  // cuando realmente cambian los valores que afectan la carga de datos
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]); // Dependencia: cargarDatos (que ya incluye sus propias dependencias)

  const renderFiltros = () => (
    <div className="filtros-informes">
      <h4>🔍 Filtros</h4>
      <div className="filtros-grid">
        <select 
          value={filtros.curso} 
          onChange={(e) => setFiltros(prev => ({...prev, curso: e.target.value}))}
        >
          <option value="">Todos los cursos</option>
          <option value="1">1er año</option>
          <option value="2">2do año</option>
          <option value="3">3er año</option>
          <option value="4">4to año</option>
          <option value="5">5to año</option>
          <option value="6">6to año</option>
        </select>

        <select 
          value={filtros.division} 
          onChange={(e) => setFiltros(prev => ({...prev, division: e.target.value}))}
        >
          <option value="">Todas las divisiones</option>
          <option value="A">División A</option>
          <option value="B">División B</option>
          <option value="C">División C</option>
        </select>

        <input
          type="date"
          value={filtros.fechaInicio}
          onChange={(e) => setFiltros(prev => ({...prev, fechaInicio: e.target.value}))}
          placeholder="Fecha inicio"
        />

        <input
          type="date"
          value={filtros.fechaFin}
          onChange={(e) => setFiltros(prev => ({...prev, fechaFin: e.target.value}))}
          placeholder="Fecha fin"
        />
      </div>
    </div>
  );

  const renderResumenGeneral = () => (
    <div className="resumen-general">
      <h3>📊 Resumen General</h3>
      
      <div className="metricas-grid">
        <div className="metrica-card">
          <div className="metrica-icono">📝</div>
          <div className="metrica-valor">{datos.resumenGeneral.totalEvaluaciones}</div>
          <div className="metrica-label">Evaluaciones totales</div>
        </div>

        <div className="metrica-card comprension">
          <div className="metrica-icono">🧠</div>
          <div className="metrica-valor">{datos.resumenGeneral.promedioComprension.toFixed(1)}</div>
          <div className="metrica-label">Promedio Comprensión</div>
          <div className="metrica-barra">
            <div 
              className="metrica-progreso"
              style={{width: `${(datos.resumenGeneral.promedioComprension / 5) * 100}%`}}
            ></div>
          </div>
        </div>

        <div className="metrica-card participacion">
          <div className="metrica-icono">🗣️</div>
          <div className="metrica-valor">{datos.resumenGeneral.promedioParticipacion.toFixed(1)}</div>
          <div className="metrica-label">Promedio Participación</div>
          <div className="metrica-barra">
            <div 
              className="metrica-progreso"
              style={{width: `${(datos.resumenGeneral.promedioParticipacion / 5) * 100}%`}}
            ></div>
          </div>
        </div>

        <div className="metrica-card dificultad">
          <div className="metrica-icono">📈</div>
          <div className="metrica-valor">{datos.resumenGeneral.promedioDificultad.toFixed(1)}</div>
          <div className="metrica-label">Promedio Dificultad</div>
          <div className="metrica-barra">
            <div 
              className="metrica-progreso"
              style={{width: `${(datos.resumenGeneral.promedioDificultad / 5) * 100}%`}}
            ></div>
          </div>
        </div>

        <div className="metrica-card motivacion">
          <div className="metrica-icono">🔥</div>
          <div className="metrica-valor">{datos.resumenGeneral.promedioMotivacion.toFixed(1)}</div>
          <div className="metrica-label">Promedio Motivación</div>
          <div className="metrica-barra">
            <div 
              className="metrica-progreso"
              style={{width: `${(datos.resumenGeneral.promedioMotivacion / 5) * 100}%`}}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPorMateria = () => (
    <div className="por-materia">
      <h3>📚 Estadísticas por Materia</h3>
      
      <div className="materias-estadisticas">
        {datos.estadisticasPorMateria.length > 0 ? (
          datos.estadisticasPorMateria.map((materia, index) => (
            <div key={index} className="materia-estadistica-card">
              <h4>{materia.nombre}</h4>
              <p><strong>Profesor:</strong> {materia.profesor}</p>
              <p><strong>Curso:</strong> {materia.curso} - <strong>División:</strong> {materia.division}</p>
              
              <div className="estadisticas-mini">
                <div className="mini-stat">
                  <span className="mini-icon">🧠</span>
                  <span className="mini-value">{materia.promedioComprension?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-icon">🗣️</span>
                  <span className="mini-value">{materia.promedioParticipacion?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-icon">📈</span>
                  <span className="mini-value">{materia.promedioDificultad?.toFixed(1) || '0.0'}</span>
                </div>
                <div className="mini-stat">
                  <span className="mini-icon">🔥</span>
                  <span className="mini-value">{materia.promedioMotivacion?.toFixed(1) || '0.0'}</span>
                </div>
              </div>
              
              <div className="evaluaciones-count">
                <strong>{materia.totalEvaluaciones || 0}</strong> evaluaciones
              </div>
            </div>
          ))
        ) : (
          <div className="no-datos">
            <p>No hay datos de evaluaciones disponibles para mostrar.</p>
            <p>Los datos aparecerán cuando los estudiantes completen sus autoevaluaciones.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderComentarios = () => (
    <div className="comentarios-section">
      <h3>💭 Comentarios de Estudiantes</h3>
      
      <div className="comentarios-lista">
        {datos.comentarios.length > 0 ? (
          datos.comentarios.map((comentario, index) => (
            <div key={index} className="comentario-card">
              <div className="comentario-header">
                <strong>{comentario.materia}</strong>
                <span className="comentario-fecha">{new Date(comentario.fecha).toLocaleDateString()}</span>
              </div>
              <div className="comentario-texto">
                "{comentario.texto}"
              </div>
              <div className="comentario-evaluacion">
                <span>🧠 {comentario.comprension}</span>
                <span>🗣️ {comentario.participacion}</span>
                <span>📈 {comentario.dificultad}</span>
                <span>🔥 {comentario.motivacion}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-datos">
            <p>No hay comentarios disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="informes-container">
      <div className="informes-header">
        <h2>📈 Informes y Estadísticas</h2>
        <div className="tipo-informe-selector">
          <button 
            className={tipoInforme === "resumen" ? "active" : ""}
            onClick={() => setTipoInforme("resumen")}
          >
            📊 Resumen
          </button>
          <button 
            className={tipoInforme === "materias" ? "active" : ""}
            onClick={() => setTipoInforme("materias")}
          >
            📚 Por Materia
          </button>
          <button 
            className={tipoInforme === "comentarios" ? "active" : ""}
            onClick={() => setTipoInforme("comentarios")}
          >
            💭 Comentarios
          </button>
        </div>
      </div>

      {renderFiltros()}

      <div className="informes-contenido">
        {loading ? (
          <div className="loading-informes">
            <p>Cargando datos estadísticos...</p>
          </div>
        ) : (
          <>
            {tipoInforme === "resumen" && renderResumenGeneral()}
            {tipoInforme === "materias" && renderPorMateria()}
            {tipoInforme === "comentarios" && renderComentarios()}
          </>
        )}
      </div>

      <div className="informes-acciones">
        <button className="btn-export">📄 Exportar informe</button>
        <button className="btn-print">🖨️ Imprimir</button>
      </div>
    </div>
  );
}

export default InformesEstadisticos;