import React from 'react';


import ModalVentana from './ModalVentana';
import { useNotification } from '../hooks/useNotification';
import API_BASE_URL from '../config/api';

export default function MateriaActions({ m, token, fetchMaterias, canDelete = true }) {
  const { notify, notifyError } = useNotification();
  // Eliminado modal de edición, solo queda lógica de borrado
  const [deleting, setDeleting] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  async function doDelete() {
    setDeleting(true);
    try {
      const url = `${API_BASE_URL}/api/materias/${m._id || m.id}`;
      const res = await fetch(url, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (!res.ok) {
        let body = null;
        try {
          body = await res.json();
        } catch {
          // ignore parse errors for non-json responses
          body = null;
        }
        throw new Error((body && (body.error || body.mensaje)) || `Status ${res.status}`);
      }
      notify('Materia eliminada');
      fetchMaterias && fetchMaterias();
      setDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Error deleting materia', err);
      notifyError('Error eliminando materia: ' + (err.message || err));
    } finally { setDeleting(false); }
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      {/* Botón de borrar */}
      {canDelete ? (
        <>
          <button className="btn-link danger" onClick={() => setDeleteConfirmOpen(true)} disabled={deleting}>{deleting ? 'Eliminando...' : 'Borrar'}</button>
        </>
      ) : null}

      {/* Modal de confirmación de borrado */}
      <ModalVentana open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} titulo={`Eliminar ${m.nombre || ''}`}>
        <div className="confirm-delete">
          <div className="confirm-text">¿Eliminar la materia "{m.nombre || ''}"? Esta acción no se puede deshacer.</div>
          <div className="confirm-actions">
            <button className="btn-secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Cancelar</button>
            <button className="btn-primary" onClick={doDelete} disabled={deleting}>{deleting ? 'Eliminando...' : 'Aceptar'}</button>
          </div>
        </div>
      </ModalVentana>
    </div>
  );
}
