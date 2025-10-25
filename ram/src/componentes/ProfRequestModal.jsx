import React from 'react';

export default function ProfRequestModal({ open, onClose, materia, form, setForm, onSubmit }) {
  if (!open) return null;

  return (
    <div className="modal-ventana">
      <div className="modal-content" style={{ minWidth: 420, padding: 12 }}>
        <h4>Solicitar asignación</h4>
        {!materia ? <div>No hay materia seleccionada.</div> : (
          <div>
            <div><strong>Materia:</strong> {materia.nombre} <small>({materia.codigo})</small></div>

            <div style={{ marginTop: 8 }}>
              <label>Horario propuesto</label>
              <input placeholder="Ej: Mañana o 14:00-16:00" value={form.horarioPropuesto || ''} onChange={(e) => setForm(f => ({ ...f, horarioPropuesto: e.target.value }))} />
            </div>

            <div style={{ marginTop: 8 }}>
              <label>Días propuestos</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'].map(day => (
                  <label key={day} style={{ fontSize: 12 }}>
                    <input type="checkbox" checked={Array.isArray(form.diasPropuestos) && form.diasPropuestos.indexOf(day) !== -1} onChange={(e) => {
                      setForm(prev => {
                        const cur = Array.isArray(prev.diasPropuestos) ? [...prev.diasPropuestos] : [];
                        if (e.target.checked) { if (cur.indexOf(day) === -1) cur.push(day); }
                        else { const idx = cur.indexOf(day); if (idx !== -1) cur.splice(idx,1); }
                        return { ...prev, diasPropuestos: cur };
                      });
                    }} /> {day}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <label>Horas semanales (opcional)</label>
              <input type="number" min={0} placeholder="Horas por semana" value={form.cargaHorariaPropuesta || ''} onChange={(e) => setForm(f => ({ ...f, cargaHorariaPropuesta: e.target.value }))} />
            </div>

            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button className="btn-primary" onClick={onSubmit}>Enviar solicitud</button>
              <button className="btn-secondary" onClick={onClose}>Cancelar</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
