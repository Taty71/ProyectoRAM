import React, { useEffect, useState } from 'react';
import { useNotification } from '../hooks/useNotification';
import '../estilos/listaProfesores.css';
import API_BASE_URL from '../config/api';
import EditarEstudiante from './EditarEstudiante';

function ListaEstudiantes({ institucionId }) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editar, setEditar] = useState(null);
  const { notify, notifyError } = useNotification();

  useEffect(() => {
    (async () => {
      if (!institucionId) return;
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/estudiantes?institucion=${institucionId}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const data = await res.json();
        if (res.ok) {
          const list = Array.isArray(data) ? data : (data.estudiantes || []);
          setEstudiantes(list);
        } else {
          setError(data.error || 'Error al obtener estudiantes');
        }
      } catch (err) {
        setError('Error de conexión');
        void err;
      }
      setLoading(false);
    })();
  }, [institucionId]);

  // Eliminar lógico (desactivar alumno)
  const desactivarEstudiante = async (id) => {
    if (!window.confirm('¿Desactivar estudiante?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/estudiantes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ activo: false })
      });
      if (res.ok) {
        setEstudiantes(prev => prev.map(s => s._id === id ? { ...s, activo: false } : s));
        notify('Estudiante desactivado correctamente');
      } else {
        const data = await res.json().catch(() => ({}));
        notifyError(data.error || 'No se pudo desactivar el estudiante');
      }
    } catch (err) {
      notifyError('Error de conexión al desactivar estudiante');
      void err;
    }
  };

  // Eliminar físico (borrar)
  const eliminarEstudiante = async (id) => {
    if (!window.confirm('¿Eliminar estudiante? Esta acción no es reversible.')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/estudiantes/${id}`, { method: 'DELETE', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      if (res.ok) {
        setEstudiantes(prev => prev.filter(s => s._id !== id));
        notify('Estudiante eliminado correctamente');
      } else {
        const data = await res.json().catch(() => ({}));
        notifyError(data.error || 'No se pudo eliminar el estudiante');
      }
    } catch (err) {
      notifyError('Error de conexión al eliminar estudiante');
      void err;
    }
  };

  return (
    <div className="lista-estudiantes-container">
      <h2>Listado de Estudiantes</h2>
      {loading ? <p>Cargando...</p> : error ? <p style={{color:'#c0392b'}}>{error}</p> : (
        <div className="table-scroll-wrapper">
          <table className="tabla-estudiantes" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Año</th>
                <th>División</th>
                <th>Especialidad</th>
                <th>Ciclo</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map(s => (
                <tr key={s._id}>
                  <td>{s.nombre}</td>
                  <td>{s.apellido}</td>
                  <td>{s.dni}</td>
                  <td>{s.email}</td>
                  <td>{s.año || s.anio || s.year}</td>
                  <td>{s.division}</td>
                  <td>{s.especialidad}</td>
                  <td>{s.ciclo || s.cicloAcademico || '-'}</td>
                  <td>{s.estadoAcademico || s.estado || (s.activo === false ? 'Inactivo' : '-')}</td>
                  <td>
                    <button onClick={() => setEditar(s)}>Editar</button>
                    <button onClick={() => desactivarEstudiante(s._id)} style={{ marginLeft: 8 }}>Desactivar</button>
                    <button onClick={() => eliminarEstudiante(s._id)} style={{ marginLeft: 8 }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editar && (
        <EditarEstudiante estudiante={editar} onClose={() => setEditar(null)} onSave={(updated) => {
          setEditar(null);
          setEstudiantes(prev => prev.map(p => p._id === updated._id ? updated : p));
        }} />
      )}
    </div>
  );
}

export default ListaEstudiantes;
