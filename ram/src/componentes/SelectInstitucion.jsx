import React, { useEffect, useState } from "react";

function SelectInstitucion({ value, onChange, actualizar, onListaCargada }) {
  const [instituciones, setInstituciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchInstituciones() {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("http://localhost:3000/api/instituciones");
        const data = await res.json();
        if (res.ok && data.instituciones) {
          setInstituciones(data.instituciones);
          if (onListaCargada) onListaCargada(data.instituciones);
        } else {
          setError(data.error || "Error al obtener instituciones");
          if (onListaCargada) onListaCargada([]);
        }
      } catch {
        setError("Error de conexión");
        if (onListaCargada) onListaCargada([]);
      }
      setLoading(false);
    }
    fetchInstituciones();
  }, [actualizar, onListaCargada]);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <label>Institución:
        {loading ? (
          <span style={{ marginLeft: 8 }}>Cargando...</span>
        ) : error ? (
          <span style={{ color: "#c0392b", marginLeft: 8 }}>
            {error === "Error de conexión"
              ? "No se pudo conectar con el servidor. Intente más tarde o contacte al administrador."
              : error}
          </span>
        ) : (
          <select value={value} onChange={e => onChange(e.target.value)} required className="select-institucion" style={{ marginLeft: 8 }}>
            <option value="">Seleccione una institución</option>
            {instituciones.map(inst => (
              <option key={inst._id} value={inst._id}>{(inst.nombre || "").replace(/&quot;/g, '"')} ({inst.codigo})</option>
            ))}
          </select>
        )}
      </label>
    </div>
  );
}

export default SelectInstitucion;
