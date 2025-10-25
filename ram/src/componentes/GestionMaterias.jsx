import React from 'react';
import API_BASE_URL from '../config/api';
import MateriaItem from './MateriaItem';
import SearchBar from './SearchBar';
import AssignControls from './AssignControls';
import ProfRequestModal from './ProfRequestModal';
import RequestsModal from './RequestsModal';
import '../estilos/gestion_materias.css';

export default function GestionMaterias({ institucionId, institucionNombre }) {
  const [materias, setMaterias] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState('');

  // assignment UI state (prefixed to avoid unused-var lint until used by future steps)
  const [_assigning, _setAssigning] = React.useState({});
  const [_assignValues, _setAssignValues] = React.useState({});

  // requests/modals
  const [profRequestOpen, setProfRequestOpen] = React.useState(false);
  const [profRequestMateria, setProfRequestMateria] = React.useState(null);
  const [profRequestForm, setProfRequestForm] = React.useState({ horarioPropuesto: '', diasPropuestos: [], cargaHorariaPropuesta: '' });

  // lista de profesores (obtenida desde backend)
  const [profesores, setProfesores] = React.useState([]);
  const [especialidades, setEspecialidades] = React.useState([]);
  const [cursos, setCursos] = React.useState([]);
  const [divisiones, setDivisiones] = React.useState([]);
  const [instituciones, setInstituciones] = React.useState([]);

  const [requestsOpen, setRequestsOpen] = React.useState(false);
  const [requestsList, setRequestsList] = React.useState([]);

  const fetchMaterias = React.useCallback(async () => {
    setLoading(true);
    try {
      // Request all materias in the collection (no institution filter).
      const url = `${API_BASE_URL}/api/materias`;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      setMaterias(Array.isArray(data) ? data : data.materias || []);
    } catch (err) {
      console.warn('fetchMaterias error', err);
      setMaterias([]);
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { fetchMaterias(); }, [fetchMaterias]);

  // obtener lista de profesores para la institución
  const fetchProfesores = React.useCallback(async () => {
    if (!institucionId) return setProfesores([]);
    try {
      const q = new URLSearchParams({ rol: 'profesor', institucionId });
      const url = `${API_BASE_URL}/api/usuarios?${q.toString()}`;
      const token = localStorage.getItem('token');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(url, { cache: 'no-cache', headers });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      // backend puede devolver { usuarios: [...] } o directamente un array
      const lista = Array.isArray(data) ? data : data.usuarios || data.users || [];
      setProfesores(lista);
    } catch (err) {
      console.warn('fetchProfesores error', err);
      setProfesores([]);
    }
  }, [institucionId]);

  React.useEffect(() => { fetchProfesores(); }, [fetchProfesores]);

  const fetchInstituciones = React.useCallback(async () => {
    try {
      const url = `${API_BASE_URL}/api/instituciones`;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json();
      // backend may return { instituciones: [...] } or array
      const list = Array.isArray(data) ? data : data.instituciones || [];
      setInstituciones(list);
    } catch (err) {
      console.warn('fetchInstituciones error', err);
      setInstituciones([]);
    }
  }, []);

  React.useEffect(() => { fetchInstituciones(); }, [fetchInstituciones]);

  const fetchCatalogs = React.useCallback(async () => {
    if (!institucionId) return;
    try {
      const base = API_BASE_URL;
      const token = localStorage.getItem('token');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      // Fetch institution cycles which include cursos and (sometimes) especialidades
      try {
        const r = await fetch(`${base}/api/instituciones/${institucionId}/ciclos-especialidades`, { headers });
        if (r.ok) {
          const payload = await r.json();
          const ciclos = payload && payload.ciclos ? payload.ciclos : [];

          const espSet = new Set();
          const cursosSet = new Set();
          const divSet = new Set();

          // default division options (first cycle A/B/C, second cycle A/B) - we'll union
          ciclos.forEach(c => {
            // If ciclo entry has an 'especialidades' array, use it
            if (Array.isArray(c.especialidades)) {
              c.especialidades.forEach(e => {
                if (!e) return;
                if (typeof e === 'string') espSet.add(e);
                else if (typeof e === 'object') espSet.add(e.nombre || e.codigo || JSON.stringify(e));
              });
            } else {
              // Some institutions model ciclos as an array of especialidad-like objects
              // e.g. { id: 'electricidad', nombre: 'Electricidad', cursos: [...] }
              if (c && (c.nombre || c.id) && !Array.isArray(c.especialidades)) {
                espSet.add(c.nombre || c.id);
              }
            }

            // cursos may be strings like '1ro' or numbers; normalize to numeric year
            if (Array.isArray(c.cursos)) {
              c.cursos.forEach(cr => {
                if (!cr && cr !== 0) return;
                const raw = String(cr);
                const num = parseInt(raw.replace(/\D/g, ''), 10);
                if (!isNaN(num)) cursosSet.add(num);
                else cursosSet.add(raw);
              });
            }
            // (no external 'cursos' dependency required)

            // infer divisions: if ciclo id or nombre contains 'CBU' assume A/B/C else A/B
            const cicloId = (c.id || '').toString().toLowerCase();
            const cicloName = (c.nombre || '').toString().toLowerCase();
            if (cicloId.includes('cbu') || cicloName.includes('cbu') || c.id === 'CBU' || c.nombre === 'CBU') {
              ['A','B','C'].forEach(d=>divSet.add(d));
            } else {
              ['A','B'].forEach(d=>divSet.add(d));
            }
          });

          setEspecialidades(Array.from(espSet));
          setCursos(Array.from(cursosSet).map(v => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : v)).sort((a,b) => Number(a) - Number(b)));
          setDivisiones(Array.from(divSet));
        }
      } catch (e) {
        console.debug('fetchCatalogs failed', e && e.message);
      }
    } catch (err) { console.warn('fetchCatalogs', err); }
  }, [institucionId]);

  React.useEffect(() => { fetchCatalogs(); }, [fetchCatalogs]);

  const filtered = React.useMemo(() => {
    if (!query) return materias;
    const q = query.toLowerCase();
    return materias.filter(m => ((m.nombre || '') + ' ' + (m.codigo || '')).toLowerCase().includes(q));
  }, [materias, query]);

  function openProfRequest(materia) {
    setProfRequestMateria(materia);
    setProfRequestForm({ horarioPropuesto: '', diasPropuestos: [], cargaHorariaPropuesta: '' });
    setProfRequestOpen(true);
  }

  async function submitProfRequest() {
    if (!profRequestMateria) return;
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/api/materias/${profRequestMateria._id || profRequestMateria.id}/assignment-requests`;
      const payload = { horarioPropuesto: profRequestForm.horarioPropuesto || '', diasPropuestos: profRequestForm.diasPropuestos || [] };
      if (profRequestForm.cargaHorariaPropuesta !== undefined && profRequestForm.cargaHorariaPropuesta !== '') payload.cargaHorariaPropuesta = Number(profRequestForm.cargaHorariaPropuesta);
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      await res.json();
      setProfRequestOpen(false);
      setProfRequestMateria(null);
    } catch (err) {
      console.error('Error sending prof request', err);
    }
  }

  async function fetchRequests() {
    try {
      const url = `${API_BASE_URL}/api/assignment-requests`;
      const token = localStorage.getItem('token');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(url, { cache: 'no-cache', headers });
      if (!res.ok) {
        if (res.status === 403) {
          console.warn('fetchRequests: 403 forbidden - missing admin role or token');
          setRequestsList([]);
          return;
        }
        throw new Error(`Status ${res.status}`);
      }
      const data = await res.json();
      setRequestsList(Array.isArray(data) ? data : data.requests || []);
    } catch (err) { console.warn('fetchRequests', err); setRequestsList([]); }
  }

  // fetch requests for one materia (admin only). This uses the admin-per-materia endpoint
  async function fetchRequestsForMateriaRequest(materiaId) {
    try {
      const url = `${API_BASE_URL}/api/materias/${materiaId}/assignment-requests`;
      const token = localStorage.getItem('token');
      const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
      const res = await fetch(url, { cache: 'no-cache', headers });
      if (!res.ok) {
        if (res.status === 403) {
          console.warn('fetchRequestsForMateriaRequest: 403 forbidden - missing admin role or token');
          setRequestsList([]);
          return;
        }
        throw new Error(`Status ${res.status}`);
      }
      const data = await res.json();
      setRequestsList(Array.isArray(data) ? data : data.requests || []);
    } catch (err) { console.warn('fetchRequestsForMateriaRequest', err); setRequestsList([]); }
  }

  async function approveRequest(r) {
    try {
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/api/assignment-requests/${r._id}/approve`;
      const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      await res.json();
      fetchRequests();
      fetchMaterias();
    } catch (err) { console.error('approveRequest', err); }
  }

  async function rejectRequest(r) {
    try {
      const token = localStorage.getItem('token');
      const id = r._id || r.id;
      const url = `${API_BASE_URL}/api/assignment-requests/${id}/reject`;
      const res = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      await res.json();
      fetchRequests();
    } catch (err) { console.error('rejectRequest', err); }
  }

  return (
    <div className="gestion-materias-root">
      <div className="gestion-header">
        <h3>Gestión de Materias</h3>
        <div className="gestion-sub">Institución: <strong>{institucionNombre || institucionId || 'N/D'}</strong></div>
      </div>

      <div className="gestion-content">
        <div style={{ marginBottom: 8 }}>
          <SearchBar value={query} onChange={setQuery} />
        </div>

        {loading ? <div>Cargando...</div> : (
          <ul className="lista-materias">
            {filtered.map(m => (
              <MateriaItem
                key={m._id || m.id}
                m={m}
                currentRole={localStorage.getItem('rol') || 'usuario'}
                currentUserId={localStorage.getItem('userId') || localStorage.getItem('id') || ''}
                assigning={_assigning}
                assignValues={_assignValues}
                setAssigning={_setAssigning}
                setAssignValues={_setAssignValues}
                openInlineAssign={(mat) => { _setAssigning(prev => ({ ...prev, [mat._id || mat.id]: true })); }}
                onEditar={() => { /* dejar handler por ahora */ }}
                onDeleteRequest={() => { /* dejar handler por ahora */ }}
                profesores={profesores}
                especialidades={especialidades}
                cursos={cursos}
                divisiones={divisiones}
                instituciones={instituciones}
                institucionId={institucionId}
                API_BASE_URL={API_BASE_URL}
                token={localStorage.getItem('token')}
                fetchMaterias={fetchMaterias}
                fetchRequestsForMateria={(mid) => { setRequestsOpen(true); fetchRequestsForMateriaRequest(mid); }}
                openProfRequest={openProfRequest}
              />
            ))}
          </ul>
        )}
      </div>

      <ProfRequestModal open={profRequestOpen} onClose={() => setProfRequestOpen(false)} materia={profRequestMateria} form={profRequestForm} setForm={setProfRequestForm} onSubmit={submitProfRequest} />

      <RequestsModal open={requestsOpen} onClose={() => setRequestsOpen(false)} requests={requestsList} onApprove={approveRequest} onReject={rejectRequest} />
    </div>
  );
}
