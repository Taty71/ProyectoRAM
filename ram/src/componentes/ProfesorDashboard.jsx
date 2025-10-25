import React, { useState, useEffect } from "react";
import InformesEstadisticos from "./InformesEstadisticos";
import TrabajosPracticosMiAprendizaje from './TrabajosPracticosMiAprendizaje';
import NotificationManager from '../utils/NotificationManager';
import "../estilos/colores.css";
import "../estilos/dashboard.css";
import "../estilos/profesorDashboard.css";
import "../estilos/estudianteDashboard.css"; // bring student dashboard styles for unified layout
import logo from "../assets/logoRAM.png";
import API_BASE_URL from '../config/api';

function ProfesorDashboard({ setPantalla }) {
  const [pantallaLocal, setPantallaLocal] = useState("dashboard");
  const [materias, setMaterias] = useState([]);
  const [selectedMateriaId, setSelectedMateriaId] = useState(localStorage.getItem('materiaId') || '');
  const [filtro, setFiltro] = useState({ ciclo: '', especialidad: '', curso: '', division: '' });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(null);

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

  // normalize string: remove diacritics, lower-case and trim
  const normalizeString = (s) => {
    try {
      return String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
    } catch (_err) {
      void _err;
      // fallback for environments that don't support \p{Diacritic}
      return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    }
  };

  // fetch materias from API (limit by profesor and/or institucion when available)
  async function fetchMaterias() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      const institucionId = localStorage.getItem('institucionId');
      if (institucionId) q.set('institucionId', institucionId);
      if (userId) q.set('profesor', userId);
      const url = `${API_BASE_URL}/api/materias?${q.toString()}`;
      const res = await fetch(url, { cache: 'no-cache', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) {
        // try to read body for helpful message
        let txt = '';
        try { const d = await res.json(); txt = JSON.stringify(d); } catch { try { txt = await res.text(); } catch { txt = ''; } }
        throw new Error(`Error cargando materias: ${res.status} ${txt}`);
      }
      const data = await res.json();
      let materiasFromApi = Array.isArray(data) ? data : data.materias || [];

      // Fallback: algunos escenarios (migraciones/assigns) almacenan las materias en el usuario
      // pero no establecen el campo `materia.profesor`. Si la consulta por ?profesor=... no
      // devolvió resultados, intentamos obtener la lista de materias desde el usuario y
      // recuperarlas individualmente para mostrarlas en el panel del profesor.
      if ((Array.isArray(materiasFromApi) && materiasFromApi.length === 0) && userId) {
        try {
          const ures = await fetch(`${API_BASE_URL}/api/usuarios/${userId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
          if (ures.ok) {
            const usuario = await ures.json();
            const ids = Array.isArray(usuario.materias) ? usuario.materias.map(m => (m._id || m.id || m).toString()) : [];
            if (ids.length > 0) {
              const materiasFetched = await Promise.all(ids.map(async (id) => {
                try {
                  const r = await fetch(`${API_BASE_URL}/api/materias/${id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
                  if (r.ok) return await r.json();
                } catch { /* ignore individual failures */ }
                return null;
              }));
              materiasFromApi = materiasFetched.filter(Boolean);
            }
          }
        } catch (uerr) {
          console.warn('fetchMaterias fallback usuario.materias failed', uerr);
        }
      }

      setMaterias(materiasFromApi || []);
    } catch (err) {
      console.error('fetchMaterias error', err);
      setError({ message: String(err) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // load materias on mount
    fetchMaterias();
    // re-fetch when switching to gestionMaterias so filters apply to fresh data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pantallaLocal === 'gestionMaterias') fetchMaterias();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantallaLocal]);
  // derive unique especialidades from materias (deduplicated by lowercase key)
  const especialidadesUnique = React.useMemo(() => {
    const map = new Map();
    (materias || []).forEach(m => {
      const raw = m && (m.especialidad || '');
      const trimmed = String(raw || '').trim();
      if (!trimmed) return;
      const key = normalizeString(trimmed);
      if (!map.has(key)) map.set(key, { key, label: trimmed });
    });
    return Array.from(map.values());
  }, [materias]);

  const filteredMaterias = React.useMemo(() => {
    const list = Array.isArray(materias) ? materias : [];
    // helper to check one materia against the active filtro
    const materiaMatchesFilter = (m) => {
      if (!m) return false;
      // if role is profesor, only show those assigned to this user
      if (rol === 'profesor' && userId) {
        if (m.profesor === undefined || m.profesor === null) return false;
        if (String(m.profesor) !== String(userId)) return false;
      }
      if (filtro.ciclo) {
        if (String(m.ciclo || '').toLowerCase() !== String(filtro.ciclo || '').toLowerCase()) return false;
      }
      if (filtro.especialidad) {
        if (normalizeString(m.especialidad) !== normalizeString(filtro.especialidad)) return false;
      }
      const materiaCurso = (m.año || m.curso || '');
      if (filtro.curso) {
        if (String(materiaCurso) !== String(filtro.curso)) return false;
      }
      if (filtro.division) {
        if (String((m.division || '')).toLowerCase() !== String((filtro.division || '')).toLowerCase()) return false;
      }
      return true;
    };

    return list.filter(materiaMatchesFilter);
  }, [materias, filtro, rol, userId]);

  const renderDashboard = () => (
    <>
      {loading ? (
        <p>Cargando materias...</p>
      ) : materias.length === 0 ? (
        <p>No tienes materias asignadas. Contactá al administrador para que te las asigne.</p>
      ) : (
        <div>
          {/* Dashboard: no filters here. Filters are shown in 'Gestionar mis materias' */}
        </div>
      )}
      <div className="panel-buttons">
        <button className="btn-primary" onClick={() => setPantallaLocal('gestionMaterias')}>📚 Gestionar mis materias</button>
        <button className="btn-primary" onClick={() => setPantallaLocal('verEvaluaciones')}>📊 Ver autoevaluaciones</button>
        <button className="btn-primary" onClick={() => setPantallaLocal('reportes')}>📈 Reportes</button>
        <button className="btn-primary" onClick={() => setPantallaLocal('trabajos')}>📄 Trabajos Prácticos</button>
      </div>

      {/* panel-filters removed from dashboard; use Gestionar materias for filtering */}

      <div className="materias-resumen">
        <h4 style={{ marginBottom: 10 }}>Mis materias asignadas</h4>
        {loading ? (
          <p>Cargando materias...</p>
        ) : filteredMaterias.length === 0 ? (
          <p style={{ color: '#6c757d' }}>No tienes materias asignadas o no hay coincidencias con el filtro.</p>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {filteredMaterias.map(m => (
              <button key={m._id || m.id} className={`materia-btn ${selectedMateriaId === (m._id || m.id) ? 'selected' : ''}`} style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 6, border: '1px solid #dfeeee', background: '#fff', cursor: 'pointer' }} onClick={() => {
                setSelectedMateriaId(m._id || m.id);
                localStorage.setItem('materiaId', m._id || m.id);
                localStorage.setItem('materiaNombre', m.nombre);
                setMensaje(`Materia seleccionada: ${m.nombre}`);
                setTimeout(() => setMensaje(''), 2200);
              }}>
                <div style={{ fontWeight: 700 }}>{m.nombre} <small style={{ color: '#666', fontWeight: 500 }}>{m.codigo ? `— ${m.codigo}` : ''}</small></div>
                <div style={{ color: '#666', fontSize: 13 }}>{m.ciclo || ''} {m.especialidad ? `— ${m.especialidad}` : ''} {m.año ? `— Año ${m.año}` : ''} {m.division ? `— Div ${m.division}` : ''}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  const renderGestionMaterias = () => (
    <div className="gestion-materias">
      <button onClick={() => setPantallaLocal("dashboard")} className="btn-volver">
        ← Volver al panel principal
      </button>
      <h3>📚 Gestión de Materias</h3>
      <p>Aquí podrás gestionar tus materias asignadas.</p>

      {rol === 'profesor' ? (
        <div className="profesor-gestion">
          <h4>Mis materias asignadas</h4>

          {/* Filters shown at top for Gestión de Materias */}
          <div className="filters-row-wrapper" style={{ margin: '6px 0 8px 0' }}>
            <div className="filters-row">
              <div className="filter-group"><label>Filtro ciclo:</label>
                <select value={filtro.ciclo} onChange={e => setFiltro(f => ({ ...f, ciclo: e.target.value }))}>
                  <option value="">Todos</option>
                  <option value="CBU">CBU</option>
                  <option value="segundo">Segundo</option>
                </select>
              </div>

              <div className="filter-group"><label>Especialidad:</label>
                <select value={filtro.especialidad} onChange={e => setFiltro(f => ({ ...f, especialidad: e.target.value }))}>
                  <option value="">Todas</option>
                  {especialidadesUnique.map(es => <option key={es.key} value={es.key}>{es.label}</option>)}
                </select>
              </div>

              <div className="filter-group"><label>Curso:</label>
                <select value={filtro.curso} onChange={e => setFiltro(f => ({ ...f, curso: e.target.value }))}>
                  <option value="">Todos</option>
                  {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}°</option>)}
                </select>
              </div>

              <div className="filter-group"><label>División:</label>
                <select value={filtro.division} onChange={e => setFiltro(f => ({ ...f, division: e.target.value }))}>
                  <option value="">Todas</option>
                  {['A','B','C'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <p>Cargando materias...</p>
          ) : materias.length === 0 ? (
            <p>No tienes materias asignadas. Contactá al administrador para que te las asigne.</p>
          ) : (
            <div>
              <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
                <label htmlFor="select-materia" style={{ marginRight: 8 }}>Seleccionar materia activa:</label>
                <select id="select-materia" value={selectedMateriaId} onChange={(e) => {
                  const selectedId = e.target.value;
                  const selected = materias.find(x => x._id === selectedId);
                  setSelectedMateriaId(selectedId);
                  if (selected) {
                    localStorage.setItem('materiaId', selected._id);
                    localStorage.setItem('materiaNombre', selected.nombre);
                    setMensaje(`Materia seleccionada: ${selected.nombre}`);
                    setTimeout(() => setMensaje(''), 2500);
                  } else {
                    localStorage.removeItem('materiaId');
                    localStorage.removeItem('materiaNombre');
                  }
                }}>
                  <option value="">-- Seleccionar --</option>
                  {materias
                    .filter(m => (!filtro.ciclo || String(m.ciclo || '').toLowerCase() === String(filtro.ciclo || '').toLowerCase()) && (!filtro.especialidad || normalizeString(m.especialidad) === normalizeString(filtro.especialidad)) && (!filtro.curso || String((m.año || m.curso || '')) === String(filtro.curso)) && (!filtro.division || String((m.division || '')).toLowerCase() === String((filtro.division || '')).toLowerCase()))
                    .map(m => (
                      <option key={m._id} value={m._id}>{m.nombre} {m.codigo ? `(${m.codigo})` : ''}</option>
                    ))}
                </select>
              </div>

              <ul>
                {materias.filter(m => (!filtro.ciclo || String(m.ciclo || '').toLowerCase() === String(filtro.ciclo || '').toLowerCase()) && (!filtro.especialidad || normalizeString(m.especialidad) === normalizeString(filtro.especialidad)) && (!filtro.curso || String((m.año || m.curso || '')) === String(filtro.curso)) && (!filtro.division || String((m.division || '')).toLowerCase() === String((filtro.division || '')).toLowerCase())).map((m) => (
                  <li key={m._id} style={{ padding: '0.5rem', background: '#f8f9fa', margin: '0.25rem 0', borderRadius: '4px' }}>
                    <strong>{m.nombre}</strong> — {m.codigo || ''} — {m.especialidad || ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="form-container">
          <h4>Crear materia</h4>
          <MateriaForm
            institucionId={localStorage.getItem('institucionId')}
            token={token}
            onCreated={(nueva) => setMaterias(prev => [nueva, ...prev])}
          />
        </div>
      )}
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
    <div className="dashboard-wrap">
      <div className="header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={logo} alt="Logo RAM" className="logo-ram" />
          <h1 className="header-title">R.A.M. - Panel del Profesor</h1>
        </div>
        <div className="header-actions">
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión">
            Cerrar sesión
          </button>
        </div>
      </div>
      <p className="slogan">Gestiona tus materias y evalúa el progreso estudiantil</p>

      <div style={{ textAlign: 'center', marginBottom: 12 }}>
        <span className="welcome-pill">Bienvenido/a, <strong>{nombre}</strong> ({rol})</span>
      </div>

      {pantallaLocal === "dashboard" && renderDashboard()}
      {pantallaLocal === "gestionMaterias" && renderGestionMaterias()}
      {pantallaLocal === "verEvaluaciones" && renderEvaluaciones()}
      {pantallaLocal === "reportes" && renderReportes()}
      {pantallaLocal === "trabajos" && (
        <div>
          <button onClick={() => setPantallaLocal('dashboard')} className="btn-volver">← Volver</button>
          <h3>📄 Trabajos Prácticos Evaluativos</h3>
          <TrabajosPracticosMiAprendizaje initialMateriaId={selectedMateriaId} />
        </div>
      )}
      <NotificationManager error={error} mensaje={mensaje} onClearError={() => setError(null)} onClearMensaje={() => setMensaje('')} />
    </div>
  );
}

export default ProfesorDashboard;