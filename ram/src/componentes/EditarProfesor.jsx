import React, { useState, useEffect } from "react";
import API_BASE_URL from '../config/api';
import '../estilos/listaProfesores.css';

function EditarProfesor({ profesor, onClose, onSave }) {
  const [form, setForm] = useState({ ...profesor });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [especialidadesOpts, setEspecialidadesOpts] = useState([]);

  useEffect(() => {
    // determine institution id from profesor or localStorage
    const inst = profesor?.institucion || localStorage.getItem('institucionId');
    if (!inst) return;
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/materias?institucion=${inst}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data) ? data : (data.materias || []);
        const uniq = Array.from(new Set(list.map(x => (x.especialidad || '').toString().trim()).filter(s => s))).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
        setEspecialidadesOpts(uniq);
      } catch { /* ignore */ }
    })();
  }, [profesor]);

  // ensure especialidades stored as array for multi-select
  useEffect(() => {
    setForm(prev => ({ ...prev, especialidades: Array.isArray(prev.especialidades) ? prev.especialidades : (prev.especialidades ? String(prev.especialidades).split(',').map(s=>s.trim()).filter(Boolean) : []) }));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleEspecialidadesChange = (e) => {
    const opts = Array.from(e.target.selectedOptions).map(o => o.value);
    setForm(prev => ({ ...prev, especialidades: opts }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem('token');
      const payload = { ...form };
      // ensure especialidades sent as array
      if (payload.especialidades && !Array.isArray(payload.especialidades)) {
        payload.especialidades = String(payload.especialidades).split(',').map(s=>s.trim()).filter(Boolean);
      }
      const res = await fetch(`${API_BASE_URL}/api/usuarios/${profesor._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        onSave(data.usuario || data || payload);
        onClose();
      } else {
        setError(data.error || "Error al actualizar usuario");
      }
    } catch {
      setError("Error de conexión");
    }
    setLoading(false);
  };

  return (
    <div className="modal-editar-profesor">
      <h3>Editar Profesor/Jefe de Área</h3>
      <form onSubmit={handleSubmit}>
        <input name="nombre" value={form.nombre || ''} onChange={handleChange} placeholder="Nombre" required />
        <input name="apellido" value={form.apellido || ''} onChange={handleChange} placeholder="Apellido" required />
        <input name="email" value={form.email || ''} onChange={handleChange} placeholder="Email" required />
        <input name="dni" value={form.dni || ''} onChange={handleChange} placeholder="DNI" required />
        <select name="rol" value={form.rol || 'profesor'} onChange={handleChange} required>
          <option value="profesor">Profesor</option>
          <option value="jefe_area">Jefe de Área</option>
        </select>

        <label style={{ display: 'block', marginTop: 8 }}>Especialidades</label>
        <select multiple name="especialidades" value={form.especialidades || []} onChange={handleEspecialidadesChange} style={{ minHeight: 90 }}>
          {especialidadesOpts.length === 0 ? (
            <option value="">(Sin especialidades detectadas)</option>
          ) : (
            especialidadesOpts.map(sp => (
              <option key={sp} value={sp}>{sp}</option>
            ))
          )}
        </select>

        <div style={{ marginTop: "1rem" }}>
          <button type="submit" disabled={loading}>Guardar</button>
          <button type="button" onClick={onClose}>Cancelar</button>
        </div>
        {error && <p style={{ color: '#c0392b' }}>{error}</p>}
      </form>
    </div>
  );
}

export default EditarProfesor;
