import React, { useEffect, useState } from "react";
import { useNotification } from '../hooks/useNotification';
import SelectInstitucion from "./SelectInstitucion";
import EditarProfesor from "./EditarProfesor";
import ModalVentana from './ModalVentana';
import '../estilos/listaProfesores.css';
import API_BASE_URL from '../config/api';

function ListaProfesores({ institucionId, institucionNombre }) {
  const { notify, notifyError } = useNotification();
  const [profesores, setProfesores] = useState([]);
  const [profesorEditar, setProfesorEditar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtroRol, setFiltroRol] = useState("");
  const [filtroEspecialidad, setFiltroEspecialidad] = useState("");
  const [especialidadesOptions, setEspecialidadesOptions] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [institucion, setInstitucion] = useState(institucionId || "");
  const [confirmAction, setConfirmAction] = useState(null);

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
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_BASE_URL}/api/usuarios?${params.toString()}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        const data = await res.json();
        if (res.ok && data.usuarios) {
          // attach materias assigned to each profesor for admin overview
          const usuarios = data.usuarios;
          const token = localStorage.getItem('token');
          try {
            const withMat = await Promise.all(usuarios.map(async prof => {
              try {
                  const mres = await fetch(`${API_BASE_URL}/api/materias?profesor=${prof._id}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
                  if (!mres.ok) return { ...prof, materias: [] };
                  const mdata = await mres.json();
                  const list = Array.isArray(mdata) ? mdata : (mdata.materias || []);
                  return { ...prof, materias: list };
                } catch { return { ...prof, materias: [] }; }
            }));
            setProfesores(withMat);
            setTotalPaginas(Math.ceil((data.total || usuarios.length) / 10));
          } catch {
            // fallback to original list if materia fetch fails
            setProfesores(usuarios);
            setTotalPaginas(Math.ceil((data.total || usuarios.length) / 10));
          }
        } else {
          setError(data.error || "Error al obtener usuarios");
        }
      } catch (err) {
        setError("Error de conexión");
        void err;
      }
      setLoading(false);
    }
    if (institucion) fetchProfesores();
  }, [pagina, filtroRol, filtroEspecialidad, busqueda, institucion]);

  // debounce search input to avoid refetch on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setBusqueda(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // fetch distinct especialidades (only when institucion changes)
  useEffect(() => {
    if (!institucion) { setEspecialidadesOptions([]); return; }
    // remove diacritics by normalizing to NFD and stripping combining marks U+0300-U+036F
    const normalize = (s) => s ? s.normalize ? s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim() : String(s).toLowerCase().trim() : '';
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const mres = await fetch(`${API_BASE_URL}/api/materias?institucion=${institucion}`, { headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!mres.ok) { setEspecialidadesOptions([]); return; }
        const mdata = await mres.json();
        const list = Array.isArray(mdata) ? mdata : (mdata.materias || []);
        // map normalized -> original (first seen)
        const map = new Map();
        for (const x of list) {
          // include both especialidad and ciclo textual values
          const candidates = [];
          const rawEsp = (x.especialidad || '').toString().trim();
          const rawCiclo = (x.ciclo || '').toString().trim();
          if (rawEsp) candidates.push(rawEsp);
          if (rawCiclo) candidates.push(rawCiclo);
          for (const raw of candidates) {
            const key = normalize(raw);
            if (!map.has(key)) map.set(key, raw);
          }
        }
        const uniq = Array.from(map.values()).sort((a,b)=>a.localeCompare(b, undefined, {sensitivity:'base'}));
        setEspecialidadesOptions(uniq);
      } catch {
        setEspecialidadesOptions([]);
      }
    })();
  }, [institucion]);

  // Eliminar lógico (marcar como inactivo) - abrimos modal de confirmación no bloqueante
  const eliminarLogico = (id) => {
    setConfirmAction({ type: 'logico', id, mensaje: '¿Seguro que quieres desactivar este usuario?' });
  };

  // Eliminar físico (borrar de la base) - abrimos modal de confirmación no bloqueante
  const eliminarFisico = (id) => {
    setConfirmAction({ type: 'fisico', id, mensaje: '¿Seguro que quieres eliminar este usuario permanentemente?' });
  };

  // Ejecuta la acción confirmada por el usuario en el modal
  const performConfirmedAction = async () => {
    if (!confirmAction) return;
    const { type, id } = confirmAction;
    setConfirmAction(null);
    try {
      const token = localStorage.getItem('token');
      if (type === 'logico') {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ activo: false })
        });
        if (res.ok) {
          setProfesores(prev => prev.map(p => p._id === id ? { ...p, activo: false } : p));
          notify('Usuario desactivado correctamente');
          return;
        }
        const d = await res.json().catch(() => ({}));
        notifyError(d.error || 'No se pudo desactivar el usuario');
        return;
      }
      if (type === 'fisico') {
        const res = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
          method: 'DELETE',
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
        if (res.ok) {
          setProfesores(prev => prev.filter(p => p._id !== id));
          notify('Usuario eliminado correctamente');
          return;
        }
        const d = await res.json().catch(() => ({}));
        notifyError(d.error || 'No se pudo eliminar el usuario');
        return;
      }
    } catch (err) {
      notifyError('Error de conexión al ejecutar la acción');
      void err;
    }
  };

  return (
    <div className="lista-profesores-container">
      <h2>Profesores y Jefes de Área</h2>
      {institucionNombre ? (
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <strong>Institución:</strong> <span style={{ color: '#0b6b66', marginLeft: 8 }}>{institucionNombre}</span>
        </div>
      ) : (
        <SelectInstitucion value={institucion} onChange={setInstitucion} />
      )}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
  <input type="text" placeholder="Buscar por nombre o email" value={searchInput} onChange={e => setSearchInput(e.target.value)} />
        <select value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="">Todos los roles</option>
          <option value="profesor">Profesor</option>
          <option value="jefe_area">Jefe de Área</option>
        </select>
        <select value={filtroEspecialidad} onChange={e => setFiltroEspecialidad(e.target.value)}>
          <option value="">Todas las especialidades</option>
          {especialidadesOptions.map(sp => (
            <option key={sp} value={sp}>{sp}</option>
          ))}
        </select>
      </div>
      {loading ? <p>Cargando...</p> : error ? <p style={{ color: '#c0392b' }}>{error}</p> : (
        <div className="table-scroll-wrapper">
          <table className="tabla-profesores">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Ciclo</th>
                <th>Especialidades</th>
                <th>Materias</th>
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
                <td>{Array.isArray(prof.materias) && prof.materias.length > 0 ? (prof.materias.slice(0,3).map(m => m.nombre).join(', ') + (prof.materias.length > 3 ? '...' : '')) : '—'}</td>
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
        </div>
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
      {/* Modal de confirmación no bloqueante para acciones sensibles */}
      <ModalVentana open={!!confirmAction} onClose={() => setConfirmAction(null)} titulo="Confirmar acción">
        <div style={{ padding: 8 }}>
          <p>{confirmAction ? confirmAction.mensaje : ''}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button className="btn-secondary" onClick={() => setConfirmAction(null)}>Cancelar</button>
            <button className="btn-primary" onClick={performConfirmedAction}>Aceptar</button>
          </div>
        </div>
      </ModalVentana>
    </div>
  );
}

export default ListaProfesores;
