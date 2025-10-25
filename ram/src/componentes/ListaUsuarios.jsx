import React, { useEffect, useState } from "react";
import API_BASE_URL from '../config/api';
import "../estilos/colores.css";
import "../estilos/listaUsuarios.css";

function ListaUsuarios({ setPantalla }) {
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch(`${API_BASE_URL}/api/usuarios?rol=profesor,jefe_area`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data.usuarios)) {
          setUsuarios(data.usuarios);
        } else {
          setError(data.error || "No se pudo obtener la lista");
        }
      })
      .catch(() => setError("Error de conexión"));
  }, []);

  return (
    <div className="lista-usuarios-container">
      <h2>Profesores y Jefes de Área Registrados</h2>
      {error && <p className="lista-usuarios-error">{error}</p>}
      <table className="lista-usuarios-tabla">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
            <th>DNI</th>
            <th>Rol</th>
            <th>Especialidades</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u._id}>
              <td>{u.nombre}</td>
              <td>{u.apellido}</td>
              <td>{u.email}</td>
              <td>{u.dni}</td>
              <td>{u.rol}</td>
              <td>{Array.isArray(u.especialidades) ? u.especialidades.join(", ") : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={() => setPantalla && setPantalla("dashboard")}>Volver al panel</button>
    </div>
  );
}

export default ListaUsuarios;
