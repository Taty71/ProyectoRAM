import React, { useState } from 'react';
import API_BASE_URL from '../config/api';

function EditarEstudiante({ estudiante, onClose, onSave }) {
  const [form, setForm] = useState({ ...estudiante });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setLoading(true); setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE_URL}/api/estudiantes/${estudiante._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        onSave(data.estudiante || data || form);
        onClose();
      } else {
        setError(data.error || 'Error al actualizar estudiante');
      }
    } catch (err) {
      setError('Error de conexión');
      void err;
    }
    setLoading(false);
  };

  return (
    <div className="modal-editar-estudiante">
      <h3>Editar Estudiante</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input name="nombre" value={form.nombre || ''} onChange={handleChange} placeholder="Nombre" required />
          <input name="apellido" value={form.apellido || ''} onChange={handleChange} placeholder="Apellido" required />
          <input name="dni" value={form.dni || ''} onChange={handleChange} placeholder="DNI" required />
          <input name="email" value={form.email || ''} onChange={handleChange} placeholder="Email" />
          <input name="año" value={form.año || form.anio || ''} onChange={handleChange} placeholder="Año" />
          <input name="division" value={form.division || ''} onChange={handleChange} placeholder="División" />
          <input name="especialidad" value={form.especialidad || ''} onChange={handleChange} placeholder="Especialidad" />
          <input name="cicloAcademico" value={form.cicloAcademico || ''} onChange={handleChange} placeholder="CicloAcademico" />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit" disabled={loading}>Guardar</button>
          <button type="button" onClick={onClose} style={{ marginLeft: 8 }}>Cancelar</button>
        </div>
        {error && <p style={{ color: '#c0392b' }}>{error}</p>}
      </form>
    </div>
  );
}

export default EditarEstudiante;
