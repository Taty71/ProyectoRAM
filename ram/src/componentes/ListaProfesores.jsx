import React, { useEffect, useState } from "react";
import SelectInstitucion from "./SelectInstitucion";
import EditarProfesor from "./EditarProfesor";

function ListaProfesores({ institucionId }) {
  const [profesores, setProfesores] = useState([]);
  const [profesorEditar, setProfesorEditar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [institucion, setInstitucion] = useState(institucionId || "");

  useEffect(() => {
    async function fetchProfesores() {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          pagina,
          rol: filtroRol,
          especialidad: filtroEspecialidad,
          busqueda,
          institucion
        });
        const res = await fetch(`http://localhost:3000/api/usuarios?${params.toString()}`);
        const data = await res.json();
        if (res.ok && data.usuarios) {
          setProfesores(data.usuarios);
          setTotalPaginas(Math.ceil((data.total || data.usuarios.length) / 10));
        } else {
          setError(data.error || "Error al obtener usuarios");
        }
      } catch {
        setError("Error de conexión");
      }
      setLoading(false);
    }
    if (institucion) fetchProfesores();
  }, [pagina, filtroRol, filtroEspecialidad, busqueda, institucion]);

  // Eliminar lógico (marcar como inactivo)
  const eliminarLogico = async (id) => {
    if (!window.confirm("¿Seguro que quieres desactivar este usuario?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: false })
      });
      if (res.ok) {
        setProfesores(prev => prev.map(p => p._id === id ? { ...p, activo: false } : p));
      }
    } catch {
      // Error handling can be added here if needed
    }
  };

  // Eliminar físico (borrar de la base)
  const eliminarFisico = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este usuario permanentemente?")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setProfesores(prev => prev.filter(p => p._id !== id));
      }
    } catch {
      setError("Error al eliminar usuario");
    }
  };

  return (
    <div className="lista-profesores-container">
      <h2>Profesores y Jefes de Área</h2>
      <SelectInstitucion value={institucion} onChange={setInstitucion} />
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
        <input type="text" placeholder="Buscar por nombre o email" value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="profesor">Profesor</option>
          <option value="jefe_area">Jefe de Área</option>
        </select>
        <input type="text" placeholder="Filtrar por especialidad" value={filtroEspecialidad} onChange={e => setFiltroEspecialidad(e.target.value)} />
      </div>
      {loading ? <p>Cargando...</p> : error ? <p style={{ color: '#c0392b' }}>{error}</p> : (
        <table className="tabla-profesores">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Ciclo</th>
              <th>Especialidades</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {profesores.map(prof => (
              <tr key={prof._id}>
                <td>{prof.nombre} {prof.apellido}</td>
                <td>{prof.email}</td>
                <td>{prof.rol}</td>
                <td>{prof.ciclo === 'cbu' ? 'CBU' : prof.ciclo === 'segundo' ? 'Segundo ciclo' : ''}</td>
                <td>{Array.isArray(prof.especialidades) ? prof.especialidades.join(", ") : prof.especialidades}</td>
                <td>{prof.activo ? "Activo" : "Inactivo"}</td>
                <td>
                  <button onClick={() => setProfesorEditar(prof)}>Editar</button>
                  <button onClick={() => eliminarLogico(prof._id)}>Eliminar lógico</button>
                  <button onClick={() => eliminarFisico(prof._id)}>Eliminar físico</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div style={{ marginTop: "1rem" }}>
        <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)}>Anterior</button>
        <span style={{ margin: "0 1rem" }}>Página {pagina} de {totalPaginas}</span>
        <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)}>Siguiente</button>
      </div>
      {profesorEditar && (
        <EditarProfesor
          profesor={profesorEditar}
          onClose={() => setProfesorEditar(null)}
          onSave={() => {
            setProfesorEditar(null);
            // Recargar lista tras edición
            setPagina(1);
          }}
        />
      )}
    </div>
  );
}

export default ListaProfesores;
