import React from 'react';
import ModalVentana from './ModalVentana';
import AssignControls from './AssignControls';
import MateriaActions from './MateriaActions';
import EditarMateriaModal from './EditarMateriaModal';
import { useNotification } from '../hooks/useNotification';

// Minimal, valid MateriaItem to unblock build. We'll expand features incrementally.
export default function MateriaItem({ m = {}, currentRole, profesores = [], especialidades = [], cursos = [], divisiones = [], token, API_BASE_URL = '', fetchMaterias = () => {}, fetchRequestsForMateria, institucionId, instituciones = [] }) {
  const { notify, notifyError } = useNotification();
  // assignOpen: which assign modals are open per materia id
  const [assignOpen, setAssignOpen] = React.useState({});
  // assignSaving: which assign actions are currently saving (per id)
  const [assignSaving, setAssignSaving] = React.useState({});
  const [assignValues, setAssignValues] = React.useState({});
  const [creatingOpen, setCreatingOpen] = React.useState(false);
  const [creatingSaving, setCreatingSaving] = React.useState(false);
  const [editingOpen, setEditingOpen] = React.useState(false);
  const [editingSaving, setEditingSaving] = React.useState(false);

  const handleSaveAssign = async (id, payloadFromChild) => {
    setAssignSaving((p) => ({ ...p, [id]: true }));
    try {
      const base = API_BASE_URL || '';
      const vals = payloadFromChild || assignValues[id] || {};

      // build restricted payload for assignment: only profesor, division and cargaHoraria (and optionally ciclo/especialidad/año if provided)
      const payload = {};
      if (typeof vals.profesor !== 'undefined' && vals.profesor !== null) payload.profesor = vals.profesor || null;
      if (typeof vals.division !== 'undefined' && vals.division !== null) payload.division = (vals.division === '__otro' ? (vals.otraDivision || vals.division) : vals.division) || null;

      // Build cargaHoraria if child provided per-day schedules or carga
      if (vals.cargaHoraria) {
        payload.cargaHoraria = vals.cargaHoraria;
      } else if (Array.isArray(vals.dias) || vals.horarios || vals.carga || vals.daySchedules) {
        const dayMap = vals.horarios || vals.daySchedules || {};
        const parts = [];
        if (Array.isArray(vals.dias) && vals.dias.length) {
          vals.dias.forEach(d => {
            const h = dayMap[d];
            if (h) parts.push(`${d}: ${h}`);
          });
        } else {
          Object.keys(dayMap || {}).forEach(k => { if (dayMap[k]) parts.push(`${k}: ${dayMap[k]}`); });
        }
        const horarioStr = parts.join(' | ');
        const cargaNum = vals.carga ? Number(vals.carga) : undefined;
        payload.cargaHoraria = {};
        if (typeof cargaNum !== 'undefined') payload.cargaHoraria.horasSemanales = cargaNum;
        if (horarioStr) payload.cargaHoraria.horario = horarioStr;
        if (Array.isArray(vals.dias)) payload.cargaHoraria.dias = vals.dias;
      }

      // optionally allow updating ciclo/especialidad/año if present in the payload (but keep assignment minimal by default)
      // Validate ciclo against allowed values from server model to avoid 500 enum errors
      const allowedCiclos = ['CBU', 'Segundo'];
      if (typeof vals.ciclo !== 'undefined') {
        if (vals.ciclo === null) {
          payload.ciclo = null;
        } else if (allowedCiclos.includes(vals.ciclo)) {
          payload.ciclo = vals.ciclo;
        } else {
          console.warn('MateriaItem: ignoring invalid ciclo value for payload', vals.ciclo);
        }
      }
      if (typeof vals.especialidad !== 'undefined') payload.especialidad = vals.especialidad;
      if (typeof vals.año !== 'undefined') {
        const n = Number(vals.año);
        if (!Number.isNaN(n)) payload.año = n;
        else console.warn('MateriaItem: ignoring invalid año value for payload', vals.año);
      }

      const url = `${base}/api/materias/${m._id}`;
  console.info('PUT assignment payload', { url, payload });
      const tokenLocal = token || localStorage.getItem('token');
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(tokenLocal ? { Authorization: `Bearer ${tokenLocal}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch (e) { body = `unable to read body: ${e && e.message}` }
        console.error('Assign PATCH failed', { status: res.status, body });
        throw new Error(`Status ${res.status} - ${body}`);
      }
      await res.json();

  // stop saving and show notification, then close modal shortly after so user can see it
  setAssignSaving((p) => ({ ...p, [id]: false }));
  fetchMaterias();
  console.info('MateriaItem: calling notify -> Asignación realizada');
  notify('Asignación realizada');
  // give the notification a bit more time to render before closing modal
  setTimeout(() => setAssignOpen((p) => ({ ...p, [id]: false })), 2000);
    } catch (e) {
      setAssignSaving((p) => ({ ...p, [id]: false }));
      notifyError({ message: 'Error guardando asignación', details: e && e.message });
    }
  };


  return (
    <li className="materia-item">
      <div className="materia-main">
        <div className="materia-titulo">{m.nombre} <span className="materia-codigo">{m.codigo}</span></div>
        <div className="materia-meta">
          {m.ciclo} Año {m.año}
          {m.especialidad ? ` · ${m.especialidad}` : ''}
          {m.division ? ` · División ${m.division}` : ''}
        </div>
      </div>

      <div className="materia-actions">
        {(() => {
          const role = (currentRole || '').toString().toLowerCase();
          const adminRoles = ['admin', 'administrador', 'superadmin', 'administrator'];
          const isAdmin = adminRoles.includes(role);
          const isEstudiante = role === 'estudiante' || role === 'student';
          return (
            <>
              <MateriaActions m={m} token={token} fetchMaterias={fetchMaterias} canDelete={!isEstudiante} />
              {/* Assign/Edit/Create actions reserved for admins only */}
              {isAdmin && (
                <>
                  <button className="btn-secondary" onClick={() => setAssignOpen((p) => ({ ...p, [m._id]: true }))}>Asignar</button>
                  <button className="btn-secondary" onClick={() => setCreatingOpen(true)}>Agregar</button>
                  <button className="btn-secondary" onClick={() => setEditingOpen(true)}>Editar</button>
                </>
              )}
            </>
          );
        })()}

        {/* Modal para asignar profesor/carga horaria */}
        <ModalVentana open={!!assignOpen[m._id]} onClose={() => setAssignOpen((p) => ({ ...p, [m._id]: false }))} titulo={`Asignar ${m.nombre}`} wide>
          <AssignControls id={m._id} ciclo={m.ciclo} asignValues={assignValues} setAssignValues={setAssignValues} onCancel={() => setAssignOpen((p) => ({ ...p, [m._id]: false }))} onSave={(payload) => handleSaveAssign(m._id, payload)} profesores={profesores} especialidades={especialidades} cursos={cursos} divisiones={divisiones} saving={!!assignSaving[m._id]} />
        </ModalVentana>

        {/* Modal para agregar nueva materia/sección con todos los datos */}
        <ModalVentana open={creatingOpen} onClose={() => setCreatingOpen(false)} titulo="Agregar materia" wide>
          <EditarMateriaModal
            open={true}
            suppressHeader={true}
            onClose={() => setCreatingOpen(false)}
            materia={null}
            profesores={profesores}
            institucionId={institucionId}
            instituciones={instituciones}
            saving={creatingSaving}
            onSave={async (payload) => {
              setCreatingSaving(true);
              try {
                const base = API_BASE_URL || '';
                const tokenLocal = token || localStorage.getItem('token');
                // `EditarMateriaModal` ahora adjunta la institución al payload (o el servidor la infiere),
                // por lo que aquí enviamos el payload tal cual y evitamos duplicar la lógica.
                const body = payload;
                const url = `${base}/api/materias`;
                const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(tokenLocal ? { Authorization: `Bearer ${tokenLocal}` } : {}) }, body: JSON.stringify(body) });
                if (!res.ok) {
                  let b = '';
                  try { b = await res.text(); } catch (e) { b = `unable to read body: ${e && e.message}` }
                  throw new Error(`Status ${res.status} - ${b}`);
                }
                await res.json();
                setCreatingSaving(false);
                fetchMaterias();
                console.info('MateriaItem: calling notify -> Materia creada');
                notify('Materia creada');
                setTimeout(() => setCreatingOpen(false), 2000);
              } catch (err) {
                setCreatingSaving(false);
                notifyError({ message: 'Error creando materia', details: err && err.message });
              }
            }}
          />
        </ModalVentana>

        {/* Modal para editar materia existente con todos los datos */}
        <ModalVentana open={editingOpen} onClose={() => setEditingOpen(false)} titulo="Editar materia" wide>
          <EditarMateriaModal
            open={true}
            suppressHeader={true}
            onClose={() => setEditingOpen(false)}
            materia={m}
            profesores={profesores}
            institucionId={institucionId}
            instituciones={instituciones}
            saving={editingSaving}
            onSave={async (payload) => {
              setEditingSaving(true);
              try {
                const tokenLocal = token || localStorage.getItem('token');
                const url = `${API_BASE_URL}/api/materias/${m._id}`;
                const body = payload;
                // sanitize body values to avoid server validation errors
                const allowedCiclos = ['CBU', 'Segundo'];
                if (typeof body.ciclo !== 'undefined' && body.ciclo !== null) {
                  // Normalize common lowercase or variant inputs to allowed enum values
                  if (typeof body.ciclo === 'string') {
                    const lc = body.ciclo.toString().trim().toLowerCase();
                    if (lc === 'cbu') body.ciclo = 'CBU';
                    else if (lc === 'segundo') body.ciclo = 'Segundo';
                    else if (!allowedCiclos.includes(body.ciclo)) {
                      console.warn('MateriaItem: removing invalid ciclo from edit payload', body.ciclo);
                      delete body.ciclo;
                    }
                  } else {
                    // not a string -> remove to avoid server validation errors
                    console.warn('MateriaItem: removing non-string ciclo from edit payload', body.ciclo);
                    delete body.ciclo;
                  }
                }
                if (typeof body.año !== 'undefined') {
                  const n = Number(body.año);
                  if (Number.isNaN(n)) {
                    console.warn('MateriaItem: removing invalid año from edit payload', body.año);
                    delete body.año;
                  } else {
                    body.año = n;
                  }
                }
                const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(tokenLocal ? { Authorization: `Bearer ${tokenLocal}` } : {}) }, body: JSON.stringify(body) });
                if (!res.ok) {
                  let b = '';
                  try { b = await res.text(); } catch (e) { b = `unable to read body: ${e && e.message}` }
                  throw new Error(`Status ${res.status} - ${b}`);
                }
                await res.json();
                setEditingSaving(false);
                fetchMaterias();
                console.info('MateriaItem: calling notify -> Materia actualizada');
                notify('Materia actualizada');
                setTimeout(() => setEditingOpen(false), 2000);
              } catch (err) {
                setEditingSaving(false);
                notifyError({ message: 'Error actualizando materia', details: err && err.message });
              }
            }}
          />
        </ModalVentana>

        {currentRole === 'admin' && <button className="btn-secondary" onClick={() => fetchRequestsForMateria && fetchRequestsForMateria(m._id)}>Ver solicitudes</button>}
      </div>
    </li>
  );
}
