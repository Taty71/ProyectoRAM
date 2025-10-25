import React, { useState } from 'react';
import { useNotification } from '../hooks/useNotification';

function MateriaForm({ institucionId, token, onCreated }) {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [especialidad, setEspecialidad] = useState('CBU');
  const [anio, setAnio] = useState(1);
  const [ciclo, setCiclo] = useState('CB');
  const [error, setError] = useState(null);
  const { notifyError } = useNotification();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
  if (!nombre || !codigo) { setError('Nombre y código son obligatorios'); notifyError('Nombre y código son obligatorios'); return; }
  if (!institucionId) { setError('No se encontró la institución.'); notifyError('No se encontró la institución.'); return; }

    setSaving(true);
    try {
      const body = {
        nombre,
        codigo,
        institucion: institucionId,
        ciclo,
        especialidad,
        año: parseInt(anio, 10),
      };

      const res = await fetch('http://localhost:3000/api/materias', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error creando materia');
        if (data.error) notifyError(data.error); else notifyError('Error creando materia');
      } else {
        setNombre('');
        setCodigo('');
        setEspecialidad('CBU');
        setAnio(1);
        setCiclo('CB');
        if (onCreated) onCreated(data.materia || data);
      }
    } catch (err) {
  setError('Error de conexión');
  notifyError('Error de conexión');
      void err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="materia-form">
      <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre de la materia" required />
      <input value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código (ej. MAT1)" required />
      <select value={anio} onChange={e => setAnio(e.target.value)}>
        <option value={1}>1er año</option>
        <option value={2}>2do año</option>
        <option value={3}>3er año</option>
        <option value={4}>4to año</option>
        <option value={5}>5to año</option>
        <option value={6}>6to año</option>
      </select>
      <select value={especialidad} onChange={e => setEspecialidad(e.target.value)}>
        <option value="CBU">CBU</option>
        <option value="ESPECIALIDAD">Especialidad</option>
      </select>
      <select value={ciclo} onChange={e => setCiclo(e.target.value)}>
        <option value="CB">Ciclo Básico</option>
        <option value="CS">Ciclo Superior</option>
      </select>
      <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Crear materia'}</button>
      {error && <div className="error-text">{error}</div>}
    </form>
  );
}

export default MateriaForm;
