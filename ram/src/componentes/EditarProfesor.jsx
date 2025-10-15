import React, { useState } from "react";

function EditarProfesor({ profesor, onClose, onSave }) {
  const [form, setForm] = useState({ ...profesor });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${profesor._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        onSave(data);
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
        <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Nombre" required />
        <input name="apellido" value={form.apellido} onChange={handleChange} placeholder="Apellido" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
        <input name="dni" value={form.dni} onChange={handleChange} placeholder="DNI" required />
        <select name="rol" value={form.rol} onChange={handleChange} required>
          <option value="profesor">Profesor</option>
          <option value="jefe_area">Jefe de Área</option>
        </select>
        <input name="especialidades" value={Array.isArray(form.especialidades) ? form.especialidades.join(", ") : form.especialidades} onChange={handleChange} placeholder="Especialidades" />
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
