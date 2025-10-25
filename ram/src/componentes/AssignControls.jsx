import React, { useEffect, useState } from 'react'
import '../estilos/AssignControls.css'

export default function AssignControls({
  id,
  asignValues,
  setAssignValues,
  profesores,
  especialidades,
  cursos,
  divisiones,
  ciclo,
  onSave,
  onCancel,
  allowEditName = false,
  initialNombre = '',
  initialCodigo = '',
  saving = false,
}){
  const v = asignValues[id] || {}
  const [local, setLocal] = useState({
    nombre: initialNombre,
    codigo: initialCodigo,
    ciclo: v.ciclo || ciclo || '',
    profesor: v.profesor || '',
    especialidad: v.especialidad || '',
    curso: v.año || '',
    division: v.division || '',
    otraDivision: v.otraDivision || '',
    dias: Array.isArray(v.dias) ? v.dias : [],
    daySchedules: (v.horarios || v.daySchedules) || {},
    carga: v.carga || '',
  })

  useEffect(()=>{
    setLocal(prev=>({
      ...prev,
      nombre: initialNombre || prev.nombre,
      codigo: initialCodigo || prev.codigo,
      profesor: v.profesor || '',
      especialidad: v.especialidad || '',
      curso: v.año || '',
      division: v.division || '',
      otraDivision: v.otraDivision || '',
    }))
  },[id, asignValues, initialNombre, initialCodigo, v.profesor, v.especialidad, v.año, v.division, v.otraDivision])

  const profesorOptions = (profesores || []).map(p=>({label: p.nombreCompleto || ((p.nombre||'')+' '+(p.apellido||'')), value: p._id}))
  const cursoOptions = cursos && cursos.length ? cursos.map(c=>({label: c.toString(), value: c})) : []
  // decide division options based on ciclo
  const inferredDivs = (local.ciclo || ciclo || '').toString().toLowerCase().includes('cbu') ? ['A','B','C'] : ['A','B']
  const divisionOptions = Array.from(new Set([...(divisiones || []), ...inferredDivs])).map(d=>({label: d, value: d}))

  function update(field, value){
    // Normalize ciclo values to match backend enum and keep local state consistent
    let v = value;
    if (field === 'ciclo' && typeof value === 'string') {
      const lc = value.toString().toLowerCase();
      if (lc === 'cbu') v = 'CBU';
      else if (lc === 'segundo') v = 'Segundo';
    }
    const next = {...local, [field]: v}
    setLocal(next)
    setAssignValues(prev=>({
      ...prev,
      [id]: {...(prev[id]||{}), ciclo: next.ciclo, profesor: next.profesor, especialidad: next.especialidad, año: next.curso, division: next.division, otraDivision: next.otraDivision, dias: next.dias, horarios: next.daySchedules || {}, carga: next.carga}
    }))
  }

  function toggleDay(day){
    const nextDays = Array.isArray(local.dias) ? [...local.dias] : []
    const idx = nextDays.indexOf(day)
    if (idx === -1) nextDays.push(day)
    else nextDays.splice(idx,1)
    update('dias', nextDays)
  }

  function updateDaySchedule(day, value){
    const schedules = { ...(local.daySchedules || {}) };
    schedules[day] = value;
    const next = { ...local, daySchedules: schedules };
    setLocal(next);
    setAssignValues(prev=>({ ...prev, [id]: {...(prev[id]||{}), horarios: schedules, dias: next.dias, carga: next.carga } }))
  }

  // Basic validation per action
  const isEditAction = typeof id === 'string' && id.startsWith('edit-')
  const isCreateAction = typeof id === 'string' && id.startsWith('new-')
  const isCreateValid = !!local.nombre && !!local.codigo && !!local.curso && !!(local.division && (local.division !== '__otro' ? true : (local.otraDivision && local.otraDivision.trim().length>0)))
  // assign valid if at least a profesor is selected or carga/division provided
  const isAssignValid = !!local.profesor || !!local.carga || (!!local.division && local.division !== '')

  function handleSave(e){
    if (e) e.preventDefault();
    const payload = {
      nombre: local.nombre,
      codigo: local.codigo,
      profesor: local.profesor || null,
      especialidad: local.especialidad || null,
      ciclo: local.ciclo || ciclo || null,
      año: local.curso || null,
      division: local.division === '__otro' ? local.otraDivision : local.division || null,
      cargaHoraria: { dias: Array.isArray(local.dias) ? local.dias : [], horarios: local.daySchedules || {}, carga: local.carga ? Number(local.carga) : undefined }
    }
    console.debug('AssignControls: onSave payload', payload);
    onSave(payload)
  }

  return (
    <form className="assign-controls" onSubmit={handleSave}>
      {allowEditName && (
        <>
          <label>Ciclo</label>
          <select value={local.ciclo||''} onChange={e=>update('ciclo', e.target.value)}>
            <option value="">-- Seleccionar --</option>
              <option value="CBU">CBU</option>
              <option value="Segundo">Segundo</option>
          </select>
          <label>Nombre de sección</label>
          <input value={local.nombre} onChange={e=>update('nombre', e.target.value)} />

          <label>Código</label>
          <input value={local.codigo} onChange={e=>update('codigo', e.target.value)} />
        </>
      )}

      <label>Profesor</label>
      <select value={local.profesor||''} onChange={e=>update('profesor', e.target.value)}>
        <option value="">-- Ninguno --</option>
        {profesorOptions.map(o=>(<option key={o.value} value={o.value}>{o.label}</option>))}
      </select>

      <label>Ciclo</label>
      <select value={local.ciclo||''} onChange={e=>update('ciclo', e.target.value)}>
        <option value="">-- Seleccionar --</option>
        <option value="CBU">CBU</option>
        <option value="Segundo">Segundo</option>
      </select>

      <label>Especialidad</label>
      <select value={local.especialidad||''} onChange={e=>update('especialidad', e.target.value)}>
        <option value="">-- Seleccionar --</option>
        {(especialidades||[]).map(s=>(<option key={s} value={s}>{s}</option>))}
      </select>

      <label>Curso</label>
      <select value={local.curso||''} onChange={e=>update('curso', e.target.value)}>
        <option value="">-- Seleccionar --</option>
        {/** If ciclo defined, show predefined ranges for CBU/Segundo, otherwise use provided cursoOptions */}
        {((local.ciclo||ciclo||'').toString().toLowerCase().includes('cbu') ? [1,2,3] : ((local.ciclo||ciclo||'').toString().toLowerCase().includes('segundo') ? [4,5,6,7] : cursoOptions.map(o=>o.value))).map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>

      <label>División</label>
      <select value={local.division||''} onChange={e=>update('division', e.target.value)}>
        <option value="">-- Seleccionar --</option>
        {divisionOptions.map(o=>(<option key={o.value} value={o.value}>{o.label}</option>))}
        <option value="__otro">Otro...</option>
      </select>

      {local.division === '__otro' && (
        <input placeholder="Nombre de división" value={local.otraDivision} onChange={e=>update('otraDivision', e.target.value)} />
      )}

      <label>Días y horarios</label>
      <div className="days-grid">
        {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].map(d => (
          <div className="days-item" key={d}>
            <label className="day-inline">
              <input className="day-checkbox" type="checkbox" checked={Array.isArray(local.dias) && local.dias.indexOf(d)!==-1} onChange={()=>toggleDay(d)} />
              <span className="day-label">{d}</span>
            </label>
            <input className="day-horario" placeholder="HH:MM-HH:MM" value={(local.daySchedules || {})[d] || ''} onChange={(e)=>updateDaySchedule(d, e.target.value)} />
          </div>
        ))}
      </div>

      <label>Carga horaria (horas)</label>
      <input type="number" value={local.carga||''} onChange={e=>update('carga', e.target.value)} />

      <div className="actions">
        <button type="button" onClick={onCancel}>Cancelar</button>
        <button type="submit" disabled={saving || (isCreateAction ? !isCreateValid : (isEditAction ? false : !isAssignValid))}>
          {saving ? 'Guardando...' : (isCreateAction ? 'Crear' : (isEditAction ? 'Actualizar' : (id && !isEditAction && !isCreateAction ? 'Guardar' : 'Guardar')))}
        </button>
      </div>
    </form>
  )
}

