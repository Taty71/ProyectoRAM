import React, { useState } from "react";

function FormularioRegistroInstitucion({ onRegistro, mensaje, error }) {
  const [institucion, setInstitucion] = useState({
    nombre: "",
    codigo: "",
    modalidad: "tecnica",
    ciclos: [
      {
        nombre: "1er ciclo",
        cursos: ["1ro", "2do", "3ro"]
      },
      {
        nombre: "2do ciclo",
        cursos: ["4to", "5to", "6to"]
      }
    ],
    email: ""
  });

  // Manejo de cambios generales
  const handleChange = (e) => {
    const { name, value } = e.target;
    setInstitucion({ ...institucion, [name]: value });
  };

  // Manejo de ciclos y cursos
  const handleCicloNombreChange = (idx, value) => {
    const nuevos = institucion.ciclos.map((c, i) =>
      i === idx ? { ...c, nombre: value } : c
    );
    setInstitucion({ ...institucion, ciclos: nuevos });
  };
  const handleCursoChange = (cicloIdx, cursoIdx, value) => {
    const nuevos = institucion.ciclos.map((c, i) => {
      if (i !== cicloIdx) return c;
      const nuevosCursos = c.cursos.map((curso, j) => (j === cursoIdx ? value : curso));
      return { ...c, cursos: nuevosCursos };
    });
    setInstitucion({ ...institucion, ciclos: nuevos });
  };
  const agregarCiclo = () => {
    setInstitucion({
      ...institucion,
      ciclos: [...institucion.ciclos, { nombre: "", cursos: [] }]
    });
  };
  const eliminarCiclo = (idx) => {
    setInstitucion({
      ...institucion,
      ciclos: institucion.ciclos.filter((_, i) => i !== idx)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onRegistro(institucion);
  };

  return (
    <form className="registro-institucion-form" onSubmit={handleSubmit}>
      <div className="registro-institucion-row">
        <label>Nombre:
          <input type="text" name="nombre" value={institucion.nombre} onChange={handleChange} required />
        </label>
        <label>Código:
          <input type="text" name="codigo" value={institucion.codigo} onChange={handleChange} required />
        </label>
      </div>
      <div className="registro-institucion-row">
        <label>Modalidad:
          <select name="modalidad" value={institucion.modalidad} onChange={handleChange} required>
            <option value="tecnica">Técnica</option>
            <option value="orientada">Orientada</option>
          </select>
        </label>
      </div>
      {/* Campos de dirección eliminados, solo se muestran los requeridos por el esquema */}
      <div className="registro-institucion-row">
        <label>Ciclos y cursos:</label>
        <div>
          {institucion.ciclos.map((ciclo, cicloIdx) => (
            <div key={cicloIdx} style={{ marginBottom: "0.7rem", borderBottom: "1px solid #e0e0e0", paddingBottom: "0.5rem" }}>
              <input type="text" placeholder="Nombre del ciclo" value={ciclo.nombre} onChange={e => handleCicloNombreChange(cicloIdx, e.target.value)} required style={{ marginRight: "1rem" }} />
              {ciclo.cursos.map((curso, cursoIdx) => (
                <input key={cursoIdx} type="text" placeholder={`Curso ${cursoIdx + 1}`} value={curso} onChange={e => handleCursoChange(cicloIdx, cursoIdx, e.target.value)} required style={{ width: "70px", marginRight: "0.5rem" }} />
              ))}
              {ciclo.cursos.length < 7 && (
                <button type="button" onClick={() => handleCursoChange(cicloIdx, ciclo.cursos.length, "")}>+ Curso</button>
              )}
              {institucion.ciclos.length > 1 && (
                <button type="button" onClick={() => eliminarCiclo(cicloIdx)} style={{ color: "#c0392b", fontWeight: "bold", marginLeft: "1rem" }}>✕ Ciclo</button>
              )}
            </div>
          ))}
          <button type="button" onClick={agregarCiclo} className="registro-institucion-btn" style={{ marginTop: "0.5rem" }}>Agregar ciclo</button>
        </div>
      </div>
      <div className="registro-institucion-actions">
        <button type="submit" className="registro-institucion-btn">Registrar Institución</button>
      </div>
      {mensaje && <p className="registro-exito">{mensaje}</p>}
      {error && <p className="registro-error">{error}</p>}
    </form>
  );
}

export default FormularioRegistroInstitucion;
