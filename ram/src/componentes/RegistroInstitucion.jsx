import React, { useState, useEffect } from "react";
import FormularioRegistroInstitucion from "./FormularioRegistroInstitucion";
import "../estilos/colores.css";
import "../estilos/registroInstitucion.css";

function RegistroInstitucion({ setPantalla, onInstitucionRegistrada }) {
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [institucionExistente, setInstitucionExistente] = useState(null);
  // Hooks de edición al inicio
  const [editando, setEditando] = useState(false);
  const [institucionEdit, setInstitucionEdit] = useState(null);
  const [mensajeEdit, setMensajeEdit] = useState("");
  const [errorEdit, setErrorEdit] = useState("");


  // Verificar si ya existe una institución registrada
  useEffect(() => {
    fetch("http://localhost:3000/api/instituciones")
      .then(res => res.json())
      .then(data => {
        if (data.instituciones && data.instituciones.length > 0) {
          setInstitucionExistente(data.instituciones[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Manejar registro desde el subcomponente
  const handleRegistro = async (institucion) => {
    setMensaje("");
    setError("");
    if (institucionExistente) {
      setError("Ya existe una institución registrada. No se puede crear otra.");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/instituciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(institucion)
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje("Institución registrada exitosamente");
        if (onInstitucionRegistrada && data.institucion && data.institucion._id) {
          onInstitucionRegistrada(data.institucion._id);
        }
      } else {
        setError(data.error || "Error al registrar institución");
      }
    } catch (err) {
      setError(err.message || "Error de conexión");
    }
  };
  // Sin condicionales para hooks
  useEffect(() => {
    if (institucionExistente) {
      setInstitucionEdit(institucionExistente);
    }
  }, [institucionExistente]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setInstitucionEdit({ ...institucionEdit, [name]: value });
  };

  const handleEditar = async (e) => {
    e.preventDefault();
    setMensajeEdit("");
    setErrorEdit("");
    try {
      const res = await fetch(`http://localhost:3000/api/instituciones/${institucionExistente._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(institucionEdit)
      });
      const data = await res.json();
      if (res.ok) {
        setMensajeEdit("Institución actualizada exitosamente");
        setEditando(false);
      } else {
        setErrorEdit(data.error || "Error al editar institución");
      }
    } catch (err) {
      setErrorEdit(err.message || "Error de conexión");
    }
  };

  const handleEliminar = async () => {
    setMensajeEdit("");
    setErrorEdit("");
    if (!window.confirm("¿Seguro que desea eliminar la institución? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`http://localhost:3000/api/instituciones/${institucionExistente._id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setMensajeEdit("Institución eliminada exitosamente");
        setInstitucionExistente(null);
      } else {
        setErrorEdit("Error al eliminar institución");
      }
    } catch (err) {
      setErrorEdit(err.message || "Error de conexión");
    }
  };

  if (institucionExistente) {
    if (editando && institucionEdit) {
      return (
        <div className="registro-institucion-container">
          <h2>Editar Institución</h2>
          <form className="registro-institucion-form" onSubmit={handleEditar}>
            <div className="registro-institucion-row">
              <label>Nombre:
                <input type="text" name="nombre" value={institucionEdit.nombre} onChange={handleEditChange} required />
              </label>
              <label>Código:
                <input type="text" name="codigo" value={institucionEdit.codigo} onChange={handleEditChange} required />
              </label>
            </div>
            {/* Puedes agregar más campos aquí según lo que permita editar */}
            <div className="registro-institucion-actions">
              <button type="submit" className="registro-institucion-btn">Guardar cambios</button>
              <button type="button" className="registro-institucion-btn volver" onClick={() => setEditando(false)}>Cancelar</button>
            </div>
          </form>
          {mensajeEdit && <p className="registro-exito">{mensajeEdit}</p>}
          {errorEdit && <p className="registro-error">{errorEdit}</p>}
        </div>
      );
    }
    return (
      <div className="registro-institucion-container">
        <h2>Institución registrada</h2>
        <p><strong>Nombre:</strong> {institucionExistente.nombre}</p>
        <p><strong>Código:</strong> {institucionExistente.codigo}</p>
        {/* Puedes mostrar más datos aquí */}
        <div className="registro-institucion-actions">
          <button className="registro-institucion-btn" onClick={() => setEditando(true)}>Editar</button>
          <button className="registro-institucion-btn" style={{ background: '#c0392b', color: 'white' }} onClick={handleEliminar}>Eliminar</button>
          <button className="registro-institucion-btn volver" onClick={() => setPantalla && setPantalla("dashboard")}>Volver al panel</button>
        </div>
        {mensajeEdit && <p className="registro-exito">{mensajeEdit}</p>}
        {errorEdit && <p className="registro-error">{errorEdit}</p>}
      </div>
    );
  }
  return (
    <div className="registro-institucion-container">
      <h2>Registrar Institución</h2>
      <FormularioRegistroInstitucion onRegistro={handleRegistro} mensaje={mensaje} error={error} />
    </div>
  );
}

export default RegistroInstitucion;
