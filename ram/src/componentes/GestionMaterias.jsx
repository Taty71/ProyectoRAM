import React from "react";
import NotificationManager from "../utils/NotificationManager";
import API_BASE_URL from "../config/api";
import "../estilos/gestion_materias.css";

function GestionMateriasWrapper({ institucionId, institucionNombre }) {
  return <GestionMaterias institucionId={institucionId} institucionNombre={institucionNombre} />;
}

function GestionMaterias({ institucionId, institucionNombre, initialTab = 'ver' }) {
  const [materias, setMaterias] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [profesores, setProfesores] = React.useState([]);
  const [tab, setTab] = React.useState(initialTab); // 'ver' | 'cargar'

  const [form, setForm] = React.useState({
    _id: null,
    nombre: "",
    codigo: "",
    ciclo: "CBU",
    especialidad: "",
    año: 1,
    profesor: ""
  });

  const [error, setError] = React.useState(null);
  const [mensaje, setMensaje] = React.useState("");

  React.useEffect(() => {
    fetchMaterias();
    fetchProfesores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institucionId]);

  async function fetchProfesores() {
    if (!institucionId) return setProfesores([]);
    try {
  const q = new URLSearchParams({ rol: 'profesor' });
  const url = `${API_BASE_URL}/api/usuarios?${q.toString()}`;
  const token = localStorage.getItem('token');
  const res = await fetch(url, { cache: 'no-cache', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) return setProfesores([]);
  // intentar parsear JSON, si no es JSON devolver array vacío
  let data;
  try { data = await res.json(); } catch (e) { console.warn('usuarios response no es JSON', e); return setProfesores([]); }
      const list = Array.isArray(data) ? data : data.usuarios || data;
      setProfesores(list);
    } catch (err) {
      console.error(err);
      setProfesores([]);
    }
  }

  async function fetchMaterias() {
    if (!institucionId) return setMaterias([]);
    setLoading(true);
    try {
  const q = new URLSearchParams({ institucionId });
  const url = `${API_BASE_URL}/api/materias?${q.toString()}`;
  const token = localStorage.getItem('token');
  const res = await fetch(url, { cache: 'no-cache', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) throw new Error(`Error ${res.status}`);
  let data;
  try { data = await res.json(); } catch (e) { console.warn('materias response no es JSON', e); setError({ message: 'Respuesta del servidor no válida. Es posible que debas iniciar sesión.', needsLogin: true }); throw e; }
      setMaterias(Array.isArray(data) ? data : data.materias || []);
    } catch (err) {
      console.error(err);
      setError({ message: 'Error cargando materias: ' + (err.message || err) });
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({ _id: null, nombre: '', codigo: '', ciclo: 'CBU', especialidad: '', año: 1, profesor: '' });
  }

  function generarCodigo() {
    const existing = new Set((materias || []).map(m => (m.codigo || '').toUpperCase()));
    const letrasOpc = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let attempt = 0; attempt < 50; attempt++) {
      const letrasLen = Math.random() < 0.4 ? 2 : 3; // 40% 2 letras, 60% 3 letras
      let letras = '';
      for (let i = 0; i < letrasLen; i++) letras += letrasOpc.charAt(Math.floor(Math.random() * letrasOpc.length));
      const numero = Math.floor(Math.random() * 90) + 10; // dos dígitos (10-99)
      const candidate = `${letras}-${numero}`;
      if (!existing.has(candidate)) return candidate;
    }
    // fallback
    return `M-${Date.now() % 10000}`;
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'año' ? Number(value) : value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!institucionId) return setError({ message: 'Falta seleccionar la institución activa.' });
    if (!form.nombre || !form.codigo) return setError({ message: 'Completar nombre y código.' });

    try {
      const token = localStorage.getItem('token');
      const payload = { nombre: form.nombre, codigo: form.codigo, ciclo: form.ciclo, especialidad: form.especialidad, año: form.año, profesor: form.profesor, institucion: institucionId };

      let res;
      if (form._id) {
        const url = `${API_BASE_URL}/api/materias/${form._id}`;
        res = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
      } else {
        const url = `${API_BASE_URL}/api/materias`;
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `Status ${res.status}`);
      }

      await res.json();
      setMensaje(form._id ? 'Materia actualizada' : 'Materia creada');
      resetForm();
      fetchMaterias();
    } catch (err) {
      console.error(err);
      setError({ message: 'Error guardando materia: ' + (err.message || err) });
    }
  }

  async function onEditar(m) {
    setForm({ _id: m._id || m.id, nombre: m.nombre || '', codigo: m.codigo || '', ciclo: m.ciclo || 'CBU', especialidad: m.especialidad || '', año: m.año || 1, profesor: m.profesor || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onDelete(m) {
    if (!confirm(`¿Eliminar materia ${m.nombre}?`)) return;
    try {
      const token = localStorage.getItem('token');
  const url = `${API_BASE_URL}/api/materias/${m._id || m.id}`;
  const res = await fetch(url, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      setMensaje('Materia eliminada');
      fetchMaterias();
    } catch (err) {
      console.error(err);
      setError({ message: 'Error eliminando materia: ' + (err.message || err) });
    }
  }

  // Cuando se abre la pestaña de carga, prellenar código
  React.useEffect(() => {
    if (tab === 'cargar' && !form.codigo) {
      const c = generarCodigo();
      setForm(f => ({ ...f, codigo: c }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // Si cambia initialTab desde el exterior, actualizar estado
  React.useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  return (
    <div className="gestion-materias-root">
      <NotificationManager error={error} mensaje={mensaje} onClearError={() => setError(null)} onClearMensaje={() => setMensaje("")} />

      {error && error.needsLogin && (
        <div style={{ margin: '8px 0' }}>
          <button className="btn-secondary" onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Ir a login</button>
        </div>
      )}

      <div className="gestion-header">
        <h3>Gestión de Materias</h3>
        <div className="gestion-sub">Institución: <strong>{institucionNombre || institucionId || 'N/D'}</strong></div>
        <div className="gestion-tabs" role="tablist">
          <button type="button" className={`tab ${tab === 'ver' ? 'active' : ''}`} onClick={() => setTab('ver')}>Ver materias</button>
          <button type="button" className={`tab ${tab === 'cargar' ? 'active' : ''}`} onClick={() => setTab('cargar')}>Cargar materia</button>
        </div>
      </div>

      <div className="gestion-content">
        {tab === 'cargar' ? (
          <form onSubmit={onSubmit} className="gestion-form">
            <div className="grid">
              <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={onChange} />
              <div style={{ display: 'flex', gap: 8 }}>
                <input name="codigo" placeholder="Código (ej: AB-12)" value={form.codigo} onChange={onChange} />
                <button type="button" className="btn-secondary" onClick={() => setForm(f => ({ ...f, codigo: generarCodigo() }))}>Regenerar</button>
              </div>
              <select name="ciclo" value={form.ciclo} onChange={onChange}>
                <option value="CBU">CBU</option>
                <option value="segundo">segundo</option>
              </select>
              <input name="especialidad" placeholder="Especialidad (opcional)" value={form.especialidad} onChange={onChange} />
              <input name="año" type="number" min={1} max={7} value={form.año} onChange={onChange} />
              <select name="profesor" value={form.profesor} onChange={onChange}>
                <option value="">-- Profesor (opcional) --</option>
                {profesores.map(p => (
                  <option key={p._id || p.id} value={p._id || p.id}>{p.nombre} {p.apellido}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary">{form._id ? 'Actualizar' : 'Crear materia'}</button>
              <button type="button" onClick={resetForm} className="btn-secondary">Limpiar</button>
            </div>
          </form>
        ) : (
          <div className="lista-materias">
            <h4>Materias</h4>
            {loading ? <div>Cargando...</div> : (
              <div>
                {materias.length === 0 && <div className="empty">No hay materias. Crea una arriba.</div>}
                <ul>
                  {materias.map(m => (
                    <li key={m._id || m.id} className="materia-item">
                      <div className="materia-main">
                        <div className="materia-titulo">{m.nombre} <span className="materia-codigo">{m.codigo}</span></div>
                        <div className="materia-meta">{m.ciclo} — Año {m.año} {m.especialidad ? `— ${m.especialidad}` : ''}</div>
                      </div>
                      <div className="materia-actions">
                        <button onClick={() => onEditar(m)} className="btn-link">Editar</button>
                        <button onClick={() => onDelete(m)} className="btn-link danger">Borrar</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionMateriasWrapper;
