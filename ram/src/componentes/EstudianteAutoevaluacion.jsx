import React, { useState, useEffect, useCallback } from "react";
import "../estilos/colores.css";
import "../estilos/dashboard.css";
import "../estilos/autoevaluacion.css";
import logo from "../assets/logo-ram.png";

function EstudianteAutoevaluacion({ setPantalla }) {
  // HOOK useState: Gestiona el estado local del componente
  // Cada useState retorna [valor, funcionParaActualizarValor]
  
  // Estados para controlar la navegación y datos del estudiante
  const [pantallaLocal, setPantallaLocal] = useState("seleccionCurso"); // Controla qué pantalla mostrar en el flujo
  const [cursoSeleccionado, setCursoSeleccionado] = useState(""); // Curso seleccionado por el estudiante
  const [divisionSeleccionada, setDivisionSeleccionada] = useState(""); // División seleccionada
  const [materias, setMaterias] = useState([]); // Lista de materias disponibles para el curso/división
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null); // Materia actual a evaluar
  const [loading, setLoading] = useState(false); // Estado de carga para las peticiones al servidor
  
  // Estado para almacenar la evaluación actual del estudiante
  const [evaluacionActual, setEvaluacionActual] = useState({
    comprension: 0,
    participacion: 0,
    dificultad: 0,
    motivacion: 0,
    comentarios: ""
  });

  // Obtener datos del estudiante desde localStorage
  const nombre = localStorage.getItem("nombre") || "Estudiante";
  const token = localStorage.getItem("token"); // Token de autenticación

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.clear();
    setPantalla && setPantalla("login");
  };

  // HOOK useCallback: Memoriza la función cargarMaterias para optimizar el rendimiento
  // Esta función solo se recrea cuando cambian curso, división o token
  // Evita peticiones innecesarias al servidor y bucles infinitos en useEffect
  const cargarMaterias = useCallback(async () => {
    // Solo ejecutar si tenemos curso y división seleccionados
    if (!cursoSeleccionado || !divisionSeleccionada) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/materias/curso/${cursoSeleccionado}/${divisionSeleccionada}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        setMaterias(data.materias || []);
      } else {
        console.error('Error cargando materias');
        setMaterias([]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMaterias([]);
    } finally {
      setLoading(false);
    }
  }, [cursoSeleccionado, divisionSeleccionada, token]); // Dependencias: se recrea solo si estos valores cambian

  // HOOK useEffect: Se ejecuta cuando el estudiante selecciona curso y división
  // Como cargarMaterias está memorizada, este effect es eficiente y no causa re-renderizados innecesarios
  useEffect(() => {
    if (cursoSeleccionado && divisionSeleccionada) {
      cargarMaterias(); // Cargar materias disponibles para la selección
    }
  }, [cargarMaterias, cursoSeleccionado, divisionSeleccionada]); // Dependencias necesarias para el correcto funcionamiento

  // COMPONENTE INTERNO: EmoticonSelector
  // Renderiza botones con emoticones para que el estudiante califique aspectos de la materia
  // Recibe: valor actual, función onChange, tipo de evaluación (comprension, participacion, etc.)
  const EmoticonSelector = ({ valor, onChange, tipo }) => {
    const emoticones = {
      comprension: [
        { valor: 1, emoji: "😵", texto: "No entendí nada", color: "#e74c3c" },
        { valor: 2, emoji: "😕", texto: "Entendí poco", color: "#f39c12" },
        { valor: 3, emoji: "😐", texto: "Entendí algo", color: "#f1c40f" },
        { valor: 4, emoji: "😊", texto: "Entendí bien", color: "#2ecc71" },
        { valor: 5, emoji: "🤩", texto: "¡Entendí todo!", color: "#27ae60" }
      ],
      participacion: [
        { valor: 1, emoji: "😴", texto: "No participé", color: "#e74c3c" },
        { valor: 2, emoji: "🤐", texto: "Participé poco", color: "#f39c12" },
        { valor: 3, emoji: "🙋‍♀️", texto: "Participé algo", color: "#f1c40f" },
        { valor: 4, emoji: "🙋‍♂️", texto: "Participé bien", color: "#2ecc71" },
        { valor: 5, emoji: "🗣️", texto: "¡Participé mucho!", color: "#27ae60" }
      ],
      dificultad: [
        { valor: 1, emoji: "😰", texto: "Muy difícil", color: "#e74c3c" },
        { valor: 2, emoji: "😅", texto: "Difícil", color: "#f39c12" },
        { valor: 3, emoji: "🤔", texto: "Normal", color: "#f1c40f" },
        { valor: 4, emoji: "😌", texto: "Fácil", color: "#2ecc71" },
        { valor: 5, emoji: "😎", texto: "Muy fácil", color: "#27ae60" }
      ],
      motivacion: [
        { valor: 1, emoji: "😞", texto: "Nada motivado", color: "#e74c3c" },
        { valor: 2, emoji: "😒", texto: "Poco motivado", color: "#f39c12" },
        { valor: 3, emoji: "😐", texto: "Normal", color: "#f1c40f" },
        { valor: 4, emoji: "😃", texto: "Motivado", color: "#2ecc71" },
        { valor: 5, emoji: "🔥", texto: "¡Súper motivado!", color: "#27ae60" }
      ]
    };

    return (
      <div className="emoticon-selector">
        {emoticones[tipo].map((item) => (
          <button
            key={item.valor}
            type="button"
            className={`emoticon-btn ${valor === item.valor ? 'selected' : ''}`}
            onClick={() => onChange(item.valor)}
            style={{
              backgroundColor: valor === item.valor ? item.color : 'transparent',
              borderColor: item.color,
              color: valor === item.valor ? 'white' : item.color
            }}
            title={item.texto}
          >
            <span className="emoticon-emoji">{item.emoji}</span>
            <span className="emoticon-texto">{item.texto}</span>
          </button>
        ))}
      </div>
    );
  };

  const renderSeleccionCurso = () => (
    <div className="seleccion-curso">
      <h3>📚 Selecciona tu curso y división</h3>
      <div className="form-container">
        <div className="curso-division-grid">
          <div>
            <label>Curso:</label>
            <select 
              value={cursoSeleccionado} 
              onChange={(e) => setCursoSeleccionado(e.target.value)}
              required
            >
              <option value="">Seleccionar curso</option>
              <option value="1">1er año</option>
              <option value="2">2do año</option>
              <option value="3">3er año</option>
              <option value="4">4to año</option>
              <option value="5">5to año</option>
              <option value="6">6to año</option>
            </select>
          </div>
          
          <div>
            <label>División:</label>
            <select 
              value={divisionSeleccionada} 
              onChange={(e) => setDivisionSeleccionada(e.target.value)}
              required
            >
              <option value="">Seleccionar división</option>
              <option value="A">División A</option>
              <option value="B">División B</option>
              <option value="C">División C</option>
            </select>
          </div>
        </div>
        
        {cursoSeleccionado && divisionSeleccionada && (
          <button 
            className="btn-primary"
            onClick={() => setPantallaLocal("seleccionMateria")}
            disabled={loading}
          >
            {loading ? "Cargando materias..." : "Continuar"}
          </button>
        )}
      </div>
    </div>
  );

  const renderSeleccionMateria = () => (
    <div className="seleccion-materia">
      <button onClick={() => setPantallaLocal("seleccionCurso")} className="btn-volver">
        ← Cambiar curso/división
      </button>
      
      <h3>📖 Selecciona la materia a evaluar</h3>
      <p>Curso: <strong>{cursoSeleccionado}° año</strong> - División: <strong>{divisionSeleccionada}</strong></p>
      
      <div className="materias-grid">
        {materias.length > 0 ? (
          materias.map((materia, index) => (
            <div 
              key={index} 
              className="materia-card"
              onClick={() => {
                setMateriaSeleccionada(materia);
                setPantallaLocal("autoevaluacion");
              }}
            >
              <h4>{materia.nombre}</h4>
              <p><strong>Profesor:</strong> {materia.profesor || "No asignado"}</p>
              <p><strong>Ciclo:</strong> {materia.ciclo === 'CB' ? 'Ciclo Básico' : 'Ciclo Superior'}</p>
              <button className="btn-secondary">Evaluar esta materia</button>
            </div>
          ))
        ) : (
          <div className="no-materias">
            <p>No hay materias disponibles para este curso y división.</p>
            <p>Contacta con tu institución para más información.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderAutoevaluacion = () => (
    <div className="autoevaluacion">
      <button onClick={() => setPantallaLocal("seleccionMateria")} className="btn-volver">
        ← Cambiar materia
      </button>
      
      <h3>🎯 Autoevaluación: {materiaSeleccionada?.nombre}</h3>
      <p>Profesor: <strong>{materiaSeleccionada?.profesor}</strong> | Ciclo: <strong>{materiaSeleccionada?.ciclo === 'CB' ? 'Ciclo Básico' : 'Ciclo Superior'}</strong></p>
      
      <div className="evaluacion-form">
        <div className="evaluacion-seccion">
          <h4>🧠 ¿Cómo fue tu comprensión de los temas?</h4>
          <EmoticonSelector 
            valor={evaluacionActual.comprension}
            onChange={(valor) => setEvaluacionActual(prev => ({...prev, comprension: valor}))}
            tipo="comprension"
          />
        </div>

        <div className="evaluacion-seccion">
          <h4>🗣️ ¿Cómo fue tu participación en clase?</h4>
          <EmoticonSelector 
            valor={evaluacionActual.participacion}
            onChange={(valor) => setEvaluacionActual(prev => ({...prev, participacion: valor}))}
            tipo="participacion"
          />
        </div>

        <div className="evaluacion-seccion">
          <h4>📈 ¿Qué tan difícil te resultó la materia?</h4>
          <EmoticonSelector 
            valor={evaluacionActual.dificultad}
            onChange={(valor) => setEvaluacionActual(prev => ({...prev, dificultad: valor}))}
            tipo="dificultad"
          />
        </div>

        <div className="evaluacion-seccion">
          <h4>🔥 ¿Qué tan motivado/a te sentiste?</h4>
          <EmoticonSelector 
            valor={evaluacionActual.motivacion}
            onChange={(valor) => setEvaluacionActual(prev => ({...prev, motivacion: valor}))}
            tipo="motivacion"
          />
        </div>

        <div className="evaluacion-seccion">
          <h4>💭 Comentarios adicionales (opcional)</h4>
          <textarea
            value={evaluacionActual.comentarios}
            onChange={(e) => setEvaluacionActual(prev => ({...prev, comentarios: e.target.value}))}
            placeholder="¿Algo más que quieras agregar sobre la materia? (opcional)"
            rows="4"
          />
        </div>

        <div className="evaluacion-acciones">
          <button 
            className="btn-primary"
            onClick={() => setPantallaLocal("confirmacion")}
            disabled={!evaluacionActual.comprension || !evaluacionActual.participacion || 
                     !evaluacionActual.dificultad || !evaluacionActual.motivacion}
          >
            Enviar autoevaluación
          </button>
        </div>
      </div>
    </div>
  );

  const renderConfirmacion = () => (
    <div className="confirmacion">
      <h3>✅ ¡Autoevaluación completada!</h3>
      <div className="resumen-evaluacion">
        <h4>Resumen de tu evaluación:</h4>
        <p><strong>Materia:</strong> {materiaSeleccionada?.nombre}</p>
        <p><strong>Profesor:</strong> {materiaSeleccionada?.profesor}</p>
        <div className="resumen-puntuaciones">
          <div>🧠 Comprensión: {evaluacionActual.comprension}/5</div>
          <div>🗣️ Participación: {evaluacionActual.participacion}/5</div>
          <div>📈 Dificultad: {evaluacionActual.dificultad}/5</div>
          <div>🔥 Motivación: {evaluacionActual.motivacion}/5</div>
        </div>
        {evaluacionActual.comentarios && (
          <div className="comentarios-resumen">
            <strong>Comentarios:</strong>
            <p>{evaluacionActual.comentarios}</p>
          </div>
        )}
      </div>
      
      <div className="confirmacion-acciones">
        <button 
          className="btn-primary"
          onClick={() => {
            // Resetear formulario
            setEvaluacionActual({
              comprension: 0,
              participacion: 0,
              dificultad: 0,
              motivacion: 0,
              comentarios: ""
            });
            setPantallaLocal("seleccionMateria");
          }}
        >
          Evaluar otra materia
        </button>
        
        <button 
          className="btn-secondary"
          onClick={() => setPantallaLocal("seleccionCurso")}
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );

  return (
    <div className="dashboard-container">
      <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
        &#x2716; Cerrar sesión
      </button>
      <img src={logo} alt="Logo RAM" className="logo-ram" />
      <h1>R.A.M. - Autoevaluación Estudiantil</h1>
      <p className="slogan">Evalúa tu experiencia de aprendizaje</p>
      
      <div className="dashboard-bienvenida">
        <span>Bienvenido/a, <strong>{nombre}</strong> 👨‍🎓</span>
      </div>

      {pantallaLocal === "seleccionCurso" && renderSeleccionCurso()}
      {pantallaLocal === "seleccionMateria" && renderSeleccionMateria()}
      {pantallaLocal === "autoevaluacion" && renderAutoevaluacion()}
      {pantallaLocal === "confirmacion" && renderConfirmacion()}
    </div>
  );
}

export default EstudianteAutoevaluacion;