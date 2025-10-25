import React from 'react';
import API_BASE_URL from '../config/api';
import NotificationManager from '../utils/NotificationManager';
import { useNotification } from '../hooks/useNotification';
import '../estilos/estudianteDashboard.css';

const EMOTICONS = [
  { id: 'love', label: 'Genial', icon: '😍' },
  { id: 'happy', label: 'Me gustó', icon: '🙂' },
  { id: 'meh', label: 'Regular', icon: '😐' },
  { id: 'sad', label: 'Difícil', icon: '😕' }
];

export default function EstudianteDashboard() {
  const [materias, setMaterias] = React.useState([]);
  const [selected, setSelected] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [trabajos, setTrabajos] = React.useState([]);
  const { notifyError, notify } = useNotification();

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const estudianteAnio = typeof window !== 'undefined' ? localStorage.getItem('año') || localStorage.getItem('anio') || localStorage.getItem('anioEstudiante') : null;
  const estudianteEspecialidad = typeof window !== 'undefined' ? localStorage.getItem('especialidad') : null;
  const estudianteDivision = typeof window !== 'undefined' ? (localStorage.getItem('division') || localStorage.getItem('divisionEstudiante') || localStorage.getItem('divisionA') ) : null;
  const estudianteCicloAcademico = typeof window !== 'undefined' ? (localStorage.getItem('cicloAcademico') || localStorage.getItem('ciclo') || localStorage.getItem('anioLectivo')) : null;
  const institucionId = typeof window !== 'undefined' ? localStorage.getItem('institucionId') : null;

  const [selectedMateriaObj, setSelectedMateriaObj] = React.useState(null);
  const [selectedProfesor, setSelectedProfesor] = React.useState(null);
  const [fetchedCount, setFetchedCount] = React.useState(0);
  const [fetchedSample, setFetchedSample] = React.useState(null);
  const [commentInputs, setCommentInputs] = React.useState({});

  React.useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
    if (institucionId) q.set('institucionId', institucionId);
    if (estudianteAnio) q.set('año', estudianteAnio);
    if (estudianteEspecialidad) q.set('especialidad', estudianteEspecialidad);
    // NOTE: don't add division/ciclo to server query because some backends don't accept these params;
    // we'll apply division/ciclo filters client-side below to avoid returning zero results from server.
        const url = `${API_BASE_URL}/api/materias${q.toString() ? `?${q.toString()}` : ''}`;
        const res = await fetch(url, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.materias || [];
        const filtered = list.filter(m => {
          if (estudianteAnio) {
            const anioVal = String(m.año || m.curso || '');
            if (String(anioVal) !== String(estudianteAnio)) return false;
          }
          if (estudianteDivision) {
            // allow materias without division (global) or exact match
            if (m.division && String(m.division).toUpperCase() !== String(estudianteDivision).toUpperCase()) return false;
          }
          if (estudianteCicloAcademico) {
            // some materias may have cicloAcademico as number
            if (m.cicloAcademico && String(m.cicloAcademico) !== String(estudianteCicloAcademico)) return false;
          }
          if (estudianteEspecialidad) {
            if (!m.especialidad) return false;
            if (String(m.especialidad).toLowerCase() !== String(estudianteEspecialidad).toLowerCase()) return false;
          }
          return true;
        });
  setFetchedCount(list.length || 0);
  setFetchedSample(list && list.length ? list[0] : null);
  setMaterias(filtered);
      } catch (err) {
        console.error('Error cargando materias para estudiante', err);
        notifyError('No se pudieron cargar las materias del curso.');
      } finally {
        setLoading(false);
      }
    })();
  }, [institucionId, estudianteAnio, estudianteEspecialidad, estudianteDivision, estudianteCicloAcademico, token, notifyError]);

  React.useEffect(() => {
    setSelectedMateriaObj(null);
    setSelectedProfesor(null);
    if (!selected) {
      setTrabajos([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/trabajos/materia/${selected}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const list = data.trabajos || [];
        setTrabajos(list);
      } catch (err) {
        console.error('Error cargando trabajos:', err);
        notifyError('No se pudieron cargar los trabajos de la materia.');
      }
    })();
  }, [selected, token, notifyError]);

  // when selected changes, find materia object and fetch its profesor details if needed
  React.useEffect(() => {
    if (!selected) return;
    const mat = materias.find(m => String(m._id || m.id) === String(selected));
    setSelectedMateriaObj(mat || null);
    setSelectedProfesor(null);
    if (mat && mat.profesor) {
      // if profesor is an object with nombre, use it; otherwise fetch
      if (typeof mat.profesor === 'object' && (mat.profesor.nombre || mat.profesor.apellido)) {
        setSelectedProfesor(mat.profesor);
      } else {
        (async () => {
          try {
            const profId = mat.profesor;
            const res = await fetch(`${API_BASE_URL}/api/usuarios/${profId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            if (!res.ok) return;
            const data = await res.json();
            const usuario = data.usuario || data.user || data;
            setSelectedProfesor(usuario || null);
          } catch { /* ignore */ }
        })();
      }
    }
  }, [selected, materias, token]);


  const obtenerValoracion = (trabajoId) => {
    try {
      const raw = localStorage.getItem(`valoracion_trabajo_${trabajoId}`);
      return raw ? raw : null;
    } catch { return null; }
  };

  // --- Reactions + gamification (persisted locally) ---
  // reaction counts stored as JSON: { love: 3, happy: 5, meh: 1, sad:0 }
  const obtenerReacciones = (trabajoId) => {
    try {
      const raw = localStorage.getItem(`reacciones_trabajo_${trabajoId}`);
      return raw ? JSON.parse(raw) : { love: 0, happy: 0, meh: 0, sad: 0 };
    } catch { return { love: 0, happy: 0, meh: 0, sad: 0 }; }
  };

  const guardarReacciones = (trabajoId, obj) => {
    try { localStorage.setItem(`reacciones_trabajo_${trabajoId}`, JSON.stringify(obj)); } catch { /* ignore */ }
  };

  // Comments (local storage per trabajo)
  const obtenerComentarios = (trabajoId) => {
    try {
      const raw = localStorage.getItem(`comentarios_trabajo_${trabajoId}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  };

  const guardarComentarios = (trabajoId, arr) => {
    try { localStorage.setItem(`comentarios_trabajo_${trabajoId}`, JSON.stringify(arr)); } catch { /* ignore */ }
  };

  const handleAddComentario = (trabajoId) => {
    const text = (commentInputs[trabajoId] || '').trim();
    if (!text) { notifyError('Escribe un comentario antes de enviar.'); return; }
    const existing = obtenerComentarios(trabajoId);
    const nuevo = { id: Date.now(), texto: text, fecha: new Date().toISOString() };
    const next = [nuevo, ...existing];
    guardarComentarios(trabajoId, next);
    // clear input
    setCommentInputs(prev => ({ ...prev, [trabajoId]: '' }));
    notify('Comentario agregado');
    // trigger re-render if needed
    setTrabajos(prev => prev.map(t => t._id === trabajoId ? { ...t } : t));
  };

  // Simple XP system per student-materia (keyed by materiaId)
  const obtenerXP = (materiaId) => {
    try { return Number(localStorage.getItem(`xp_materia_${materiaId}`) || 0); } catch { return 0; }
  };
  const guardarXP = (materiaId, xp) => {
    try { localStorage.setItem(`xp_materia_${materiaId}`, String(xp)); } catch { /* ignore */ }
  };

  // Override setValoracion to update reacciones and XP
  const setValoracionInteractiva = (trabajoId, emotId) => {
    try {
      // save single-user selection
      localStorage.setItem(`valoracion_trabajo_${trabajoId}`, emotId);

      // increment reaction count locally
      const counts = obtenerReacciones(trabajoId);
      counts[emotId] = (counts[emotId] || 0) + 1;
      guardarReacciones(trabajoId, counts);

      // award XP to materia (if selectedMateriaObj available)
      if (selectedMateriaObj && (selectedMateriaObj._id || selectedMateriaObj.id)) {
        const mid = selectedMateriaObj._id || selectedMateriaObj.id;
        const current = obtenerXP(mid);
        const next = current + 10; // flat 10 XP per reaction
        guardarXP(mid, next);
        notify(`Valoración guardada · +10 XP (Total ${next})`);
      } else {
        notify('Valoración guardada');
      }

      // force refresh of trabajos to show active UI change
      setTrabajos(prev => prev.map(t => t._id === trabajoId ? { ...t } : t));
    } catch (e) { console.warn(e); notifyError('No se pudo guardar la valoración'); }
  };

  const handleLogout = () => {
    // limpiar claves relacionadas con la sesión/estudiante y redirigir al inicio
    try {
      const keys = ['token', 'rol', 'institucionId', 'especialidad', 'año', 'anio', 'division', 'cicloAcademico', 'ciclo', 'nombre', 'apellido', 'userId', 'idEstudiante'];
      keys.forEach(k => localStorage.removeItem(k));
    } catch { /* ignore localStorage errors */ }
    // redirigir al inicio o login
    window.location.href = '/';
  };

  return (
    <div className="dashboard-wrap">
      <div className="header-row">
        <h3 className="header-title">Mis Aprendizajes</h3>
        <div className="header-actions">
          <button className="logout-btn" onClick={handleLogout} title="Cerrar sesión y volver al inicio">Cerrar sesión</button>
        </div>
      </div>
      <div className="selector-row">
        <select className="selector" value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">-- Seleccioná una materia --</option>
          {materias.map(m => (
            <option key={m._id || m.id} value={m._id || m.id}>{m.nombre} {m.codigo ? `(${m.codigo})` : ''}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty-state">Cargando materias...</div>
      ) : materias.length === 0 ? (
        <div className="empty-state">
          <div>No se encontraron materias para tu curso/especialidad.</div>
          <div style={{marginTop:8, fontSize:12, color:'#2b5a57'}}>
            {`Filtros aplicados: año=${estudianteAnio || 'N/A'}, división=${estudianteDivision || 'N/A'}, ciclo=${estudianteCicloAcademico || 'N/A'}`}
          </div>
          <div style={{marginTop:6, fontSize:12, color:'#2b5a57'}}>
            {`Materias devueltas por servidor: ${fetchedCount}`}
            {fetchedSample ? ` (ej: ${fetchedSample.nombre || fetchedSample.codigo || fetchedSample._id})` : ''}
          </div>
        </div>
      ) : !selected ? (
        <div className="empty-state">Seleccioná una materia para ver tus trabajos y recursos.</div>
      ) : (
        <div>
          <div className="material-area">
            <h4 style={{ textAlign: 'center' }}>Material y trabajos de la materia</h4>
            <p style={{ textAlign: 'center', color: '#447' }}>Aquí podrás ver tus trabajos y recursos para la materia seleccionada.</p>
            <p style={{ textAlign: 'center', color: '#334', marginTop: 6 }}>
              Profesor de la materia: {selectedProfesor ? `${selectedProfesor.nombre || ''} ${selectedProfesor.apellido || ''}` : (selectedMateriaObj && selectedMateriaObj.profesor ? 'Cargando...' : 'Desconocido')}
            </p>
          </div>

          <div className="card-container">
            {trabajos.length === 0 ? (
              <div className="empty-state">No hay trabajos publicados para esta materia.</div>
            ) : (
              trabajos.map(trab => (
                <div key={trab._id || trab.id} className="trabajo-card">
                  <div className="trabajo-title">{trab.titulo}</div>
                  <div className="trabajo-meta">Profesor: {trab.profesor ? `${trab.profesor.nombre || ''} ${trab.profesor.apellido || ''}` : 'Desconocido'}</div>
                  <div className="trabajo-desc">{trab.descripcion || 'Sin descripción'}</div>
                  <div style={{ marginTop: 8 }} className="emoticons">
                    <div className="reactions-row">
                      {EMOTICONS.map(em => {
                        const valor = obtenerValoracion(trab._id || trab.id);
                        const active = valor === em.id;
                        const counts = obtenerReacciones(trab._id || trab.id);
                        const count = counts && counts[em.id] ? counts[em.id] : 0;
                        return (
                          <button key={em.id} title={em.label} className={`emoti-btn ${active ? 'active' : ''}`} onClick={() => setValoracionInteractiva(trab._id || trab.id, em.id)}>
                            <span className="emoti-emoji">{em.icon}</span>
                            <span className="emoti-count">{count}</span>
                          </button>
                        );
                      })}
                      {/* XP / level display for selected materia */}
                      {selectedMateriaObj && (
                        <div style={{ marginLeft: 12, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 140 }} className="level-bar"><div className="level-fill" style={{ width: `${Math.min(100, (obtenerXP(selectedMateriaObj._id || selectedMateriaObj.id) % 100))}%` }} /></div>
                            <div className="xp-pill">XP {obtenerXP(selectedMateriaObj._id || selectedMateriaObj.id)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Comments section */}
                  <div className="comments-section" style={{ marginTop: 12 }}>
                    <div className="comment-form" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <textarea
                        className="comment-textarea"
                        placeholder="Dejá un comentario sobre este trabajo..."
                        value={commentInputs[trab._id || trab.id] || ''}
                        onChange={e => setCommentInputs(prev => ({ ...prev, [trab._id || trab.id]: e.target.value }))}
                        rows={2}
                        />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button className="btn-primary" onClick={() => handleAddComentario(trab._id || trab.id)}>Enviar</button>
                      </div>
                    </div>
                    <div className="comments-list" style={{ marginTop: 10 }}>
                      {obtenerComentarios(trab._id || trab.id).length === 0 ? (
                        <div style={{ color: '#557', fontSize: 13 }}>Sé el primero en comentar.</div>
                      ) : (
                        obtenerComentarios(trab._id || trab.id).map(c => (
                          <div key={c.id} className="comment-item">
                            <div className="comment-text">{c.texto}</div>
                            <div className="comment-meta">{new Date(c.fecha).toLocaleString()}</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <NotificationManager />
    </div>
  );
}
