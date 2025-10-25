import React from 'react';
import API_BASE_URL from '../config/api';
import NotificationManager from '../utils/NotificationManager';
import { useNotification } from '../hooks/useNotification';
import '../estilos/trabajosPracticos.css';

export const TrabajosPracticosMiAprendizaje = ({ initialMateriaId = '' }) => {
  const [materias, setMaterias] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [, setError] = React.useState(null);
  const { notify, notifyError } = useNotification();

  const [form, setForm] = React.useState({ materia: initialMateriaId || '', ciclo: 'CBU', especialidad: '', curso: 1, division: '', titulo: '', descripcion: '', temas: '' });
  const [misTrabajos, setMisTrabajos] = React.useState([]);
  const [institucionEspecialidades, setInstitucionEspecialidades] = React.useState([]);
  const [fallbackEspecialidades, setFallbackEspecialidades] = React.useState([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  const profesorNombre = typeof window !== 'undefined' ? localStorage.getItem('nombre') || '' : '';

  React.useEffect(() => {
    // Cargar materias asignadas al profesor (fallback a listar todas si no hay endpoint)
    (async () => {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/api/materias`;
        // intentar filtrar por profesor si existe userId
        if (userId) url = `${API_BASE_URL}/api/materias?profesor=${userId}`;
        const res = await fetch(url, { cache: 'no-cache', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.materias || []);
        setMaterias(list);

        // Obtener especialidades definidas por la institución (para poblar select en segundo ciclo)
        try {
          const institucionId = typeof window !== 'undefined' ? localStorage.getItem('institucionId') : null;
          if (institucionId) {
            const r = await fetch(`${API_BASE_URL}/api/instituciones/${institucionId}/ciclos-especialidades`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            if (r.ok) {
              const payload = await r.json().catch(() => null);
              const ciclos = payload && payload.ciclos ? payload.ciclos : [];
              const espSet = new Set();
              ciclos.forEach(c => {
                if (Array.isArray(c.especialidades)) {
                  c.especialidades.forEach(e => {
                    if (!e) return;
                    if (typeof e === 'string') espSet.add(e);
                    else if (typeof e === 'object') espSet.add(e.nombre || e.codigo || JSON.stringify(e));
                  });
                } else {
                  if (c && (c.nombre || c.id) && !Array.isArray(c.especialidades)) {
                    espSet.add(c.nombre || c.id);
                  }
                }
              });
              const espArray = Array.from(espSet);
              setInstitucionEspecialidades(espArray);

              // Si la institución no define especialidades, intentar un fallback al endpoint global
              if (!espArray.length) {
                try {
                  const f = await fetch(`${API_BASE_URL}/api/materias/especialidades`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
                  if (f.ok) {
                    const fb = await f.json().catch(() => null);
                    const list = fb && fb.especialidades ? fb.especialidades : (Array.isArray(fb) ? fb : []);
                    setFallbackEspecialidades(Array.isArray(list) ? list : []);
                  }
                } catch (ee) {
                  console.debug('No se pudo obtener fallback de especialidades', ee && ee.message);
                }
              }
            }
          }
        } catch (e) {
          console.debug('No se pudieron obtener especialidades de la institución', e && e.message);
        }

        // If we have an initialMateriaId not present in the list, fetch it explicitly (useful when opened from dashboard)
        if (initialMateriaId && !list.find(x => (x._id || x.id) === initialMateriaId)) {
          try {
            const mRes = await fetch(`${API_BASE_URL}/api/materias/${initialMateriaId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
            if (mRes.ok) {
              const mData = await mRes.json().catch(() => null);
              if (mData) {
                setMaterias(prev => [mData, ...prev]);
                setForm(f => ({ ...f, materia: initialMateriaId, ciclo: mData.ciclo || f.ciclo, especialidad: mData.especialidad || f.especialidad, curso: mData.año || mData.anio || f.curso }));
              }
            }
          } catch (e) {
            console.warn('No se pudo obtener materia inicial', e);
          }
        }
      } catch (err) {
        console.error('Error cargando materias para trabajos', err);
        setError({ message: 'No se pudieron cargar las materias. ' + (err.message || '') });
        notifyError('No se pudieron cargar las materias. ' + (err.message || ''));
      } finally { setLoading(false); }
    })();

    // Cargar trabajos del profesor
    (async () => {
      if (!userId) return;
      try {
        const url = `${API_BASE_URL}/api/trabajos?profesor=${userId}`;
        const res = await fetch(url, { cache: 'no-cache', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) return;
        const data = await res.json();
        setMisTrabajos(Array.isArray(data.trabajos) ? data.trabajos : (data.trabajos || []));
      } catch (err) { console.warn('No se pudieron cargar mis trabajos', err); }
    })();
            {(() => {
              const cicloLower = String(form.ciclo || '').toLowerCase();
              const habilitado = cicloLower === 'segundo';

              const materiaObj = materias.find(m => (m._id || m.id) === form.materia);

              // Build the options list in priority order:
              // 1) especialidad predefinida en la materia seleccionada
              // 2) especialidades definidas por la institución
              // 3) fallback global desde /api/materias/especialidades
              // 4) dedupe de especialidades detectadas en las materias cargadas
              let optionsList = [];
              if (materiaObj && materiaObj.especialidad && habilitado) {
                optionsList = [String(materiaObj.especialidad).trim()];
              } else if (habilitado) {
                if (Array.isArray(institucionEspecialidades) && institucionEspecialidades.length > 0) {
                  optionsList = institucionEspecialidades.slice();
                } else if (Array.isArray(fallbackEspecialidades) && fallbackEspecialidades.length > 0) {
                  optionsList = fallbackEspecialidades.slice();
                } else {
                  // dedupe especialidades encontradas en las materias cargadas
                  const normalize = s => (String(s || '').normalize ? String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : String(s).toLowerCase().trim());
                  const map = new Map();
                  (materias || []).forEach(m => {
                    if (!m || !m.especialidad) return;
                    const raw = String(m.especialidad).trim();
                    const key = normalize(raw);
                    if (!map.has(key)) map.set(key, raw);
                  });
                  optionsList = Array.from(map.values());
                }
              }

              const selectRequired = habilitado && optionsList.length > 0;

              return (
                <>
                  <select id="especialidad" name="especialidad" value={form.especialidad} onChange={handleChange} className="tp-select" required={selectRequired} disabled={!habilitado}>
                    <option value="">-- Seleccionar especialidad --</option>
                    {optionsList.map(es => <option key={es} value={es}>{es}</option>)}
                  </select>
                  {habilitado && optionsList.length === 0 && (
                    <div style={{ marginTop: 6, color: '#a33', fontSize: 13 }}>
                      No se encontraron especialidades para este ciclo. Verificá en Setup que la institución tenga especialidades configuradas o agregá especialidades desde Gestión de Materias.
                    </div>
                  )}
                </>
              );
            })()}

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    // compute ciclo result after this change (so we can decide whether to set/clear especialidad)
    const cicloDespues = name === 'ciclo' ? value : (form.ciclo || '');

    // If changing the materia, auto-fill ciclo/especialidad from the materia record when available
    if (name === 'materia') {
      const materiaObj = materias.find(m => (m._id || m.id) === value);
      if (materiaObj) {
        const newForm = { ...form, materia: value };
        // set ciclo from materia if present
        if (materiaObj.ciclo) newForm.ciclo = materiaObj.ciclo;
        // only set especialidad if ciclo (after change) is 'segundo'
        const cicloCheck = String(cicloDespues || newForm.ciclo || '').toLowerCase();
        if (cicloCheck === 'segundo') {
          newForm.especialidad = materiaObj.especialidad || '';
        } else {
          newForm.especialidad = '';
        }
        newForm.curso = materiaObj.año || materiaObj.anio || newForm.curso;
        setForm(newForm);
        return;
      }
      // if materia not found, just set it
      setForm(f => ({ ...f, materia: value }));
      return;
    }

    // If changing ciclo, clear especialidad when ciclo is not 'segundo'
    if (name === 'ciclo') {
      const cicloLower = String(value || '').toLowerCase();
      if (cicloLower !== 'segundo') {
        setForm(f => ({ ...f, [name]: value, especialidad: '' }));
        return;
      }
    }

    setForm(f => ({ ...f, [name]: name === 'curso' ? Number(value) : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
  if (!form.materia) return setError({ message: 'Seleccioná una materia' });
  if (!form.titulo) return setError({ message: 'Ingresá un título para el trabajo' });
  // la especialidad es obligatoria sólo si estamos en segundo ciclo
  const cicloLower = String(form.ciclo || '').toLowerCase();
  const habilitado = cicloLower === 'segundo';
  // Determine whether there are any available especialidad options to choose from
  let opcionesDisponibles = false;
  if (habilitado) {
    if (Array.isArray(institucionEspecialidades) && institucionEspecialidades.length > 0) opcionesDisponibles = true;
    else if (Array.isArray(fallbackEspecialidades) && fallbackEspecialidades.length > 0) opcionesDisponibles = true;
    else {
      // check if any materia has an especialidad defined
      for (let i = 0; i < (materias || []).length; i++) {
        const m = materias[i];
        if (m && m.especialidad) { opcionesDisponibles = true; break; }
      }
    }
  }
  const requiereEspecialidad = habilitado && opcionesDisponibles;
  if (requiereEspecialidad && !form.especialidad) return setError({ message: 'Seleccioná una especialidad' });
    try {
      // client-side check: ensure that the selected materia is assigned to this profesor
      const materiaObj = materias.find(m => (m._id || m.id) === form.materia);
      if (materiaObj) {
        const assignedId = materiaObj.profesor || materiaObj.profesorId || materiaObj.profesor_id || '';
        if (assignedId && String(assignedId) !== String(userId)) {
          // materia assigned to other professor
          return setError({ message: 'No podés crear trabajos para esta materia: fue asignada a otro profesor. Pedí que la reasignen o asignátela en Gestión de Materias.' });
        }
        if (!assignedId) {
          return setError({ message: 'La materia seleccionada no tiene profesor asignado. Asignate la materia primero en Gestión de Materias para poder crear trabajos.' });
        }
      }
      const payload = {
        titulo: form.titulo,
        descripcion: form.descripcion,
        materia: form.materia,
        ciclo: form.ciclo,
        especialidad: form.especialidad,
        curso: form.curso,
        division: form.division,
        profesor: userId,
        temasAprendizaje: form.temas ? String(form.temas).split(',').map(s => s.trim()).filter(Boolean) : []
      };
      const url = `${API_BASE_URL}/api/trabajos`;
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error((body && (body.error || body.mensaje)) ? (body.error || body.mensaje) : `Status ${res.status}`);
      }
      const data = await res.json();
      notify('Trabajo práctico creado');
      // agregar al listado
      setMisTrabajos(prev => [data.trabajo || data, ...prev]);
      // reset form (mantener materia seleccionada)
      setForm(f => ({ ...f, titulo: '', descripcion: '', temas: '' }));
    } catch (err) {
      console.error('Error creando trabajo', err);
      const msg = 'Error creando trabajo: ' + (err.message || '');
      setError({ message: msg });
      notifyError(msg);
    }
  }

  return (
    <div className="tp-container">
      <NotificationManager />

      <div className="tp-header">
        <div className="tp-title">Trabajos prácticos (Mi aprendizaje)</div>
        {loading && <div style={{ padding: 6, color: '#0066cc' }}>Cargando materias...</div>}
        <div style={{ marginTop: 6, marginBottom: 6, color: '#225' }}><strong>Profesor:</strong> {profesorNombre || '—'}</div>
        <div className="tp-sub">Podés crear trabajos prácticos evaluativos asociados a una materia de la que sos profesor. Seleccioná materia y curso, luego agregá título, descripción y temas (separados por coma).</div>
      </div>

      <form onSubmit={handleSubmit} className="tp-form">
        <div className="tp-row">
          <div className="tp-field">
            <label className="tp-label" htmlFor="materia">Materia</label>
            <select id="materia" name="materia" value={form.materia} onChange={handleChange} className="tp-select">
              <option value="">-- Seleccionar materia --</option>
              {materias.map(m => (
                <option key={m._id || m.id} value={m._id || m.id}>{m.nombre} {m.codigo ? `(${m.codigo})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="tp-field" style={{ maxWidth: 140 }}>
            <label className="tp-label" htmlFor="curso">Curso</label>
            <select id="curso" name="curso" value={form.curso} onChange={handleChange} className="tp-input-small">
              {[1,2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}°</option>)}
            </select>
          </div>
        </div>

        <div className="tp-row">
          <div className="tp-field">
            <label className="tp-label" htmlFor="ciclo">Ciclo</label>
            <select id="ciclo" name="ciclo" value={form.ciclo} onChange={handleChange} className="tp-select">
              <option value="CBU">Primer ciclo (CBU)</option>
              <option value="segundo">Segundo ciclo</option>
            </select>
          </div>

          <div className="tp-field">
            <label className="tp-label" htmlFor="especialidad">Especialidad</label>
            {(() => {
              const cicloLower = String(form.ciclo || '').toLowerCase();
              const habilitado = cicloLower === 'segundo';

              const materiaObj = materias.find(m => (m._id || m.id) === form.materia);

              let optionsList = [];
              if (materiaObj && materiaObj.especialidad && habilitado) {
                optionsList = [String(materiaObj.especialidad).trim()];
              } else if (habilitado) {
                if (Array.isArray(institucionEspecialidades) && institucionEspecialidades.length > 0) {
                  optionsList = institucionEspecialidades.slice();
                } else if (Array.isArray(fallbackEspecialidades) && fallbackEspecialidades.length > 0) {
                  optionsList = fallbackEspecialidades.slice();
                } else {
                      const normalize = s => (String(s || '').normalize ? String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim() : String(s).toLowerCase().trim());
                  const map = new Map();
                  (materias || []).forEach(m => {
                    if (!m || !m.especialidad) return;
                    const raw = String(m.especialidad).trim();
                    const key = normalize(raw);
                    if (!map.has(key)) map.set(key, raw);
                  });
                  optionsList = Array.from(map.values());
                }
              }

              const selectRequired = habilitado && optionsList.length > 0;

              return (
                <>
                  <select id="especialidad" name="especialidad" value={form.especialidad} onChange={handleChange} className="tp-select" required={selectRequired} disabled={!habilitado}>
                    <option value="">-- Seleccionar especialidad --</option>
                    {optionsList.map(es => <option key={es} value={es}>{es}</option>)}
                  </select>
                  {habilitado && optionsList.length === 0 && (
                    <div style={{ marginTop: 6, color: '#a33', fontSize: 13 }}>
                      No se encontraron especialidades para este ciclo. Verificá en Setup que la institución tenga especialidades configuradas o agregá especialidades desde Gestión de Materias.
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="tp-field" style={{ maxWidth: 140 }}>
            <label className="tp-label" htmlFor="division">División</label>
            <select id="division" name="division" value={form.division} onChange={handleChange} className="tp-input-small">
              <option value="">-- División --</option>
              {((form.curso || 1) <= 3 ? ['A','B','C'] : ['A','B']).map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <input name="titulo" placeholder="Título del trabajo" value={form.titulo} onChange={handleChange} className="tp-input" />
        <textarea name="descripcion" placeholder="Descripción (opcional)" value={form.descripcion} onChange={handleChange} rows={3} className="tp-textarea" />
        <input name="temas" placeholder="Temas / Aprendizajes (separar por coma)" value={form.temas} onChange={handleChange} className="tp-input" />

        <div className="tp-actions">
          <button type="submit" disabled={loading} className="btn-primary-tp">{loading ? 'Enviando...' : 'Agregar trabajo'}</button>
          <button type="button" onClick={() => setForm({ ...form, titulo: '', descripcion: '', temas: '' })} disabled={loading} className="btn-secondary-tp">Limpiar</button>
        </div>
      </form>

      <div className="tp-divider" />
      <h5 className="tp-recent">Mis trabajos recientes</h5>

      <div className="tp-card">
        {misTrabajos.length === 0 ? (
          <p>No tenés trabajos cargados aún.</p>
        ) : (
          <ul>
            {misTrabajos.map(t => (
              <li key={t._id || t.id} className="tp-item">
                <div style={{ fontWeight: '600' }}>{t.titulo} <small style={{ color: '#666' }}>{t.materiaCodigo ? `(${t.materiaCodigo})` : ''}</small></div>
                <div style={{ color: '#666', fontSize: 13 }}>Curso: {t.curso}{t.division ? ` - División ${t.division}` : ''} {t.ciclo ? ` - ${t.ciclo}` : ''}</div>
                <div style={{ color: '#444' }}>{t.descripcion}</div>
                {Array.isArray(t.temasAprendizaje) && t.temasAprendizaje.length > 0 && <div style={{ marginTop: 6, fontSize: 13 }}><strong>Temas:</strong> {t.temasAprendizaje.join(', ')}</div>}
              </li>
            ))}
          </ul>
        )}
        </div>
    </div>
  );
}

export default TrabajosPracticosMiAprendizaje;


