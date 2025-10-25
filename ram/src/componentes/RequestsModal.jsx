import React from 'react';

export default function RequestsModal({ open, onClose, requests = [], onApprove, onReject }) {
  if (!open) return null;

  return (
    <div className="modal-ventana">
      <div className="modal-content" style={{ minWidth: 420, padding: 12 }}>
        <h4>Solicitudes de asignación</h4>
        {(!requests || requests.length === 0) ? (
          <div>No hay solicitudes.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {requests.map(r => (
              <li key={r._id} style={{ borderBottom: '1px solid #eee', padding: '8px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div>
                    <div><strong>Profesor:</strong> {(r.profesor && (r.profesor.nombre || r.profesor.nombreCompleto)) || r.profesor}</div>
                    <div><strong>Materia:</strong> {(r.materia && (r.materia.nombre || r.materia.codigo)) || r.materia}</div>
                    <div><strong>Horario propuesto:</strong> {r.horarioPropuesto || 'N/D'}</div>
                    <div><strong>Estado:</strong> {r.estado}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {r.estado === 'pending' && (
                      <>
                        <button className="btn-primary" onClick={() => onApprove && onApprove(r)}>Aprobar</button>
                        <button className="btn-secondary" onClick={() => onReject && onReject(r)}>Rechazar</button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: 8, textAlign: 'right' }}>
          <button className="btn-secondary" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
