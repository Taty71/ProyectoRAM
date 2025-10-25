import React, { useState, useEffect } from 'react';
import '../estilos/editar_materia_modal.css';
import { useNotification } from '../hooks/useNotification';

export default function EditarMateriaModal({ open, onClose, materia, profesores = [], onSave, saving, institucionId, instituciones = [], suppressHeader = false }) {
  const { notify, notifyError } = useNotification();
  const [form, setForm] = useState({
    nombre: '', codigo: '', ciclo: '', año: 1, division: '', especialidad: '', profesor: '',
    carga: '', horario: '', dias: [], daySchedules: {}
  });
  const [selectedInstitucion, setSelectedInstitucion] = useState(null);

  useEffect(() => {
    // Initialize form and selectedInstitucion whenever modal opens or materia changes
    const extractId = val => {
      if (!val) return null;
      if (typeof val === 'string') return val;
      return val._id || val.id || null;
    };

    if (materia) {
      // normalize cargaHoraria from different shapes
      const ch = materia.cargaHoraria || {};
      // prefer horasSemanales, then carga, then horasTotales
      const cargaVal = (typeof ch.horasSemanales !== 'undefined' && ch.horasSemanales !== null) ? ch.horasSemanales : (typeof ch.carga !== 'undefined' ? ch.carga : ch.horasTotales);
      let diasArr = Array.isArray(ch.dias) ? ch.dias.slice() : [];
      let schedules = {};
      // helper to normalize day names (accept with/without accents)
      const canonicalDays = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const stripAccents = s => s ? s.normalize('NFD').replace(/\p{Diacritic}/gu, '') : s;
      const findCanonical = raw => {
        if (!raw) return null;
        const cand = raw.toString().trim();
        const low = stripAccents(cand).toLowerCase();
        for (const d of canonicalDays) if (stripAccents(d).toLowerCase() === low) return d;
        // fallback: try to match prefix words
        for (const d of canonicalDays) if (stripAccents(cand).toLowerCase().startsWith(stripAccents(d).toLowerCase())) return d;
        return cand;
      };

      // 1. Si hay horarios (objeto), usarlo y poblar días desde sus keys
      if (ch.horarios && typeof ch.horarios === 'object' && Object.keys(ch.horarios).length) {
        Object.keys(ch.horarios).forEach(k => {
          const canon = findCanonical(k) || k;
          const v = ch.horarios[k];
          if (v) schedules[canon] = v;
          if (diasArr.indexOf(canon) === -1) diasArr.push(canon);
        });
      }
      // 2. Si hay horario (string), parsear y poblar ambos daySchedules y dias
      if (ch.horario && typeof ch.horario === 'string' && ch.horario.trim().length) {
        const parts = ch.horario.split(/[|;,]/);
        parts.forEach(part => {
          const p = part.trim();
          if (!p) return;
          // match 'Day : times' or 'Day - times' or 'Day – times'
          const m = p.match(/^(.+?)[\s:\-–]+(.+)$/);
          if (!m) return;
          const rawDay = m[1].trim();
          const times = m[2].trim();
          const day = findCanonical(rawDay) || rawDay;
          if (day) schedules[day] = times;
          if (diasArr.indexOf(day) === -1) diasArr.push(day);
        });
      }
      // 3. Si hay dias (array), asegurar que estén tildados aunque no tengan horario
      if (Array.isArray(ch.dias)) {
        ch.dias.forEach(d => {
          const canon = findCanonical(d) || d;
          if (diasArr.indexOf(canon) === -1) diasArr.push(canon);
        });
      }

      // Map horarios por día para el formulario: para todos los días de la semana
      const diasSemana = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
      const daySchedulesFinal = {};
      diasSemana.forEach(dia => {
        // Si hay horario para el día, mostrarlo
        if (schedules[dia]) {
          daySchedulesFinal[dia] = schedules[dia];
        } else {
          daySchedulesFinal[dia] = '';
        }
      });

      // Los días tildados son los del array dias
      const diasChecked = Array.isArray(diasArr) ? diasArr : [];

      setForm({
        nombre: materia.nombre || '',
        codigo: materia.codigo || '',
        ciclo: materia.ciclo || '',
        año: materia.año || 1,
        division: materia.division || '',
        especialidad: materia.especialidad || '',
        profesor: materia.profesor?._id || materia.profesor || '',
        carga: cargaVal || '',
        horario: ch.horario || '',
        dias: diasChecked,
        daySchedules: daySchedulesFinal
      });
      // ensure we store an id (string) not an object
      const materiaInstId = extractId(materia.institucion);
      const propInstId = extractId(institucionId);
      const firstInstId = (instituciones && instituciones[0]) ? extractId(instituciones[0]) : null;
      setSelectedInstitucion(materiaInstId || propInstId || firstInstId || (typeof window !== 'undefined' ? localStorage.getItem('institucionId') : null));
    } else {
      // creating new materia: default selected institution from prop, first available, or localStorage
      setForm({
        nombre: '', codigo: '', ciclo: '', año: 1, division: '', especialidad: '', profesor: '',
        carga: '', horario: '', dias: [], daySchedules: {}
      });
      const propInstId = extractId(institucionId);
      const firstInstId = (instituciones && instituciones[0]) ? extractId(instituciones[0]) : null;
      const lsInst = (typeof window !== 'undefined') ? localStorage.getItem('institucionId') : null;
      setSelectedInstitucion(propInstId || firstInstId || lsInst || null);
    }
  }, [materia, open, institucionId, instituciones]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setForm(f => ({ ...f, dias: checked ? [...f.dias, value] : f.dias.filter(d => d !== value) }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  const updateDaySchedule = (day, value) => {
    setForm(f => ({ ...f, daySchedules: { ...(f.daySchedules || {}), [day]: value }, dias: Array.isArray(f.dias) && f.dias.indexOf(day) === -1 ? [...f.dias, day] : f.dias }));
  }

  const handleSubmit = e => {
    e.preventDefault();
    if (!form.nombre || !form.codigo) {
      notifyError('Nombre y código son obligatorios');
      return;
    }
    if (onSave) {
      const payload = {
        nombre: form.nombre,
        codigo: form.codigo,
        ciclo: form.ciclo,
        año: Number(form.año),
        division: form.division,
        especialidad: form.especialidad,
        profesor: form.profesor,
        cargaHoraria: {
          horasSemanales: form.carga ? Number(form.carga) : undefined,
          horario: form.horario || undefined,
          horarios: form.daySchedules && Object.keys(form.daySchedules).length ? form.daySchedules : undefined,
          dias: form.dias
        }
      };

        // Normalize ciclo to server-expected enum values to avoid validation errors
        if (payload.ciclo && typeof payload.ciclo === 'string') {
          const lc = payload.ciclo.toString().trim().toLowerCase();
          if (lc === 'cbu') payload.ciclo = 'CBU';
          else if (lc === 'segundo') payload.ciclo = 'Segundo';
        }

        // If creating a new materia, check current role to decide whether assigning a different profesor
        // is allowed. Admin roles should be able to assign any profesor. Only enforce replacement
        // when the current user is a 'profesor' (no admin privileges).
        if (!materia) {
          try {
            const roleRaw = (typeof window !== 'undefined') ? (localStorage.getItem('rol') || '') : '';
            const role = String(roleRaw || '').toLowerCase();
            const currentUserId = (typeof window !== 'undefined') ? (localStorage.getItem('userId') || localStorage.getItem('id') || '') : '';
            console.info('[EditarMateriaModal] role/currentUserId/payload.profesor ->', role, currentUserId, payload.profesor);

            const adminRoles = ['admin', 'administrador', 'superadmin', 'administrator'];
            const isProfesorRole = role === 'profesor' || role === 'teacher';
            const isAdminRole = adminRoles.includes(role);

            if (isProfesorRole && payload.profesor && currentUserId && payload.profesor !== currentUserId) {
              // replace to avoid 403 for non-admin users
              payload.profesor = currentUserId;
              try { notify('Se ha asignado tu usuario como profesor por permisos'); } catch(e) { void e; }
            } else if (!isAdminRole) {
              // Not admin and not professor - conservatively remove profesor field to avoid 403
              if (payload.profesor && !isProfesorRole) {
                console.info('[EditarMateriaModal] user role is not admin; removing profesor from payload to avoid authorization error');
                delete payload.profesor;
              }
            }
          } catch (e) { console.warn('[EditarMateriaModal] error checking role/currentUserId', e && e.message); }
        }

      // If creating a new materia (materia is falsy), ensure we include the active institution id.
      // Prefer explicit prop, otherwise read from localStorage (set by the app when selecting institution).
      const resolvedInstitucion = selectedInstitucion || institucionId || (typeof window !== 'undefined' ? localStorage.getItem('institucionId') : null);
      if (!materia && resolvedInstitucion) payload.institucion = resolvedInstitucion;

      console.debug('EditarMateriaModal: onSave payload', payload);
      onSave(payload);
    }
  };

  if (!open) return null;

  const diasSemana = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

  // Generate friendly placeholders based on selected ciclo/año/división/especialidad
  const makeCodeStub = () => {
    const parts = [];
    if (form.año) parts.push(String(form.año));
    if (form.division) parts.push(String(form.division));
    const base = parts.length ? parts.join('') : 'X';
    // attempt 3-letter acronym from especialidad or nombre
    const acronym = (form.especialidad || form.nombre || '').split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0,3) || 'MAT';
    return `${acronym}-${base}`;
  };

  const namePlaceholder = (() => {
    const seg = [];
    if (form.ciclo) seg.push(form.ciclo);
    if (form.año) seg.push(String(form.año));
    if (form.division) seg.push(String(form.division));
    if (form.especialidad) seg.push(`(${form.especialidad})`);
    return seg.length ? `p.ej. ${seg.join(' ')} - Materia` : 'p.ej. Matemáticas orientadas';
  })();
  const codePlaceholder = makeCodeStub();

  return (
    <div className="editar-materia-modal">
      {!suppressHeader && <h2>{materia ? 'Editar materia' : 'Agregar materia'}</h2>}
      <form className="editar-materia-form" onSubmit={handleSubmit}>
        {!materia && (
          <div className="form-field full">
            <label>Institución</label>
            <select value={selectedInstitucion || ''} onChange={e => setSelectedInstitucion(e.target.value)}>
              <option value="">-- Seleccionar institución --</option>
              {instituciones && instituciones.map(inst => (
                <option key={inst._id || inst.id} value={inst._id || inst.id}>{inst.nombre || inst.nombre}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-field">
          <label>Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} placeholder={namePlaceholder} required />
        </div>

        <div className="form-field">
          <label>Código</label>
          <input name="codigo" value={form.codigo} onChange={handleChange} placeholder={codePlaceholder} required />
        </div>

        <div className="form-field">
          <label>Ciclo</label>
          <input name="ciclo" value={form.ciclo} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label>Año</label>
          <input name="año" type="number" min={1} max={7} value={form.año} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label>División</label>
          <input name="division" value={form.division} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label>Especialidad</label>
          <input name="especialidad" value={form.especialidad} onChange={handleChange} />
        </div>

        <div className="form-field">
          <label>Profesor</label>
          <select name="profesor" value={form.profesor} onChange={handleChange}>
            <option value="">Sin asignar</option>
            {profesores.map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.nombre} {p.apellido}</option>)}
          </select>
        </div>

        <div className="form-field">
          <label>Carga horaria (horas)</label>
          <input name="carga" type="number" value={form.carga} onChange={handleChange} />
        </div>

        <div className="form-field full">
          <label>Días y horarios</label>
          <div className="days-grid">
            {diasSemana.map(dia => (
              <div className="days-item" key={dia}>
                <label className="day-inline">
                  <input className="day-checkbox" type="checkbox" name="dias" value={dia} checked={Array.isArray(form.dias) && form.dias.indexOf(dia)!==-1} onChange={handleChange} />
                  <span className="day-label">{dia}</span>
                </label>
                <input className="day-horario" placeholder="HH:MM-HH:MM" value={(form.daySchedules || {})[dia] || ''} onChange={(e)=>updateDaySchedule(dia, e.target.value)} />
              </div>
            ))}
          </div>
        </div>

        <div className="editar-materia-actions form-field full">
          <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
          <button className="btn-secondary" type="button" onClick={onClose}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
