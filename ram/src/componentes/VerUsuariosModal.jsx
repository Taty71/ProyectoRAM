import React from 'react';
import ModalVentana from './ModalVentana';
import SearchBar from './SearchBar';
import NotificationManager from '../utils/NotificationManager';
import { useNotification } from '../hooks/useNotification';
import API_BASE_URL from '../config/api';
import '../estilos/verUsuarios.css';
import { administradorSchema } from '../utils/validatorYup';

function VerUsuariosModal({ open, onClose }) {
  const [usuarios, setUsuarios] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState(null);
  const { notify, notifyError, clearMensaje } = useNotification();

  const [editOpen, setEditOpen] = React.useState(false);
  const [editUser, setEditUser] = React.useState(null);
  const [editForm, setEditForm] = React.useState({});
  const [editErrors, setEditErrors] = React.useState({});
  const [editLoading, setEditLoading] = React.useState(false);
  const [availableEspecialidades, setAvailableEspecialidades] = React.useState(['CBU', 'Electricidad', 'Programación']);

  

  const fetchEspecialidadesInstitucion = React.useCallback(async (institucionId) => {
    if (!institucionId) return;
    try {
      const url = `${API_BASE_URL}/api/instituciones/${institucionId}/ciclos-especialidades`;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return;
      const data = await res.json();
      const ciclos = Array.isArray(data.ciclos) ? data.ciclos : [];
      const setEspecial = new Set();
      ciclos.forEach(c => {
        if (Array.isArray(c.especialidades)) {
          c.especialidades.forEach(sp => setEspecial.add(String(sp).trim()));
        }
      });
      const opciones = Array.from(setEspecial);
      if (opciones.length) setAvailableEspecialidades(opciones);
    } catch (err) {
      console.warn('No se pudieron cargar especialidades de la institución', err);
    }
  }, []);

  const fetchInstitucionActiva = React.useCallback(async () => {
    try {
      const url = `${API_BASE_URL}/api/instituciones/activa`;
      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) return null;
      const data = await res.json();
      const instit = data.institucion || data;
      return instit && (instit._id || instit.id) ? String(instit._id || instit.id) : null;
    } catch (err) {
      console.warn('No se pudo obtener institución activa', err);
      return null;
    }
  }, []);

  const fetchUsuarios = React.useCallback(async () => {
    setLoading(true);
    try {
    const token = localStorage.getItem('token');
    // El administrador debe ver todos los usuarios de la institución; el backend infiere
    // la institución a partir del token.
    // NOTA: no pasar una lista de roles separada por comas porque el backend espera un solo valor.
    const url = `${API_BASE_URL}/api/usuarios`;
  console.debug('[VerUsuariosModal] URL petición:', url);
  const headers = { ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  console.debug('[VerUsuariosModal] cabeceras de la petición:', headers);
  let res;
  try {
    res = await fetch(url, { cache: 'no-cache', headers });
    console.debug('[VerUsuariosModal] estado de respuesta:', res.status);
    if (!res.ok) throw new Error(`Status ${res.status}`);
  } catch (firstErr) {
    console.warn('[VerUsuariosModal] primer fetch falló:', firstErr);
    // Intentar un segundo intento sin la cabecera Authorization para detectar si la falla
    // se debe a la red/CORS o a un token/cabecera malformada.
    if (token) {
      try {
        console.debug('[VerUsuariosModal] reintentando sin cabecera Authorization');
        res = await fetch(url, { cache: 'no-cache' });
        console.debug('[VerUsuariosModal] estado del reintento:', res.status);
        if (!res.ok) throw new Error(`Status ${res.status}`);
      } catch (secondErr) {
        console.error('[VerUsuariosModal] el reintento también falló:', secondErr);
        throw secondErr; // relanzar para que lo capture el catch exterior
      }
    } else {
      throw firstErr;
    }
  }
      let data;
      try { data = await res.json(); } catch { data = null; }
      // API returns { usuarios, total } — normalize to array
      const list = Array.isArray(data?.usuarios) ? data.usuarios : (Array.isArray(data) ? data : (data?.usuarios || []));
      setUsuarios(list);
      // Load especialidades from active institution (more robust than inferring from users)
      const institucionId = await fetchInstitucionActiva();
      if (institucionId) await fetchEspecialidadesInstitucion(institucionId);
      // expose total if provided
      if (typeof data?.total === 'number') setTotal(data.total);
    } catch (err) {
      console.error('Error fetching usuarios', err);
      const friendly = err && err.message && err.message.includes('Failed to fetch')
        ? 'No se pudo conectar al servidor API. Verifique que el backend esté corriendo en el puerto correcto y que no haya problemas de CORS o red.'
        : `No se pudieron cargar los usuarios. ${err.message || err}`;
      setError({ message: friendly });
      notifyError(friendly);
    } finally {
      setLoading(false);
    }
  }, [fetchEspecialidadesInstitucion, fetchInstitucionActiva, notifyError]);

  React.useEffect(() => {
    if (open) fetchUsuarios();
    else {
      // clear transient states when closing
      setQuery('');
      setError(null);
      // clear global inline notification if any
      if (typeof clearMensaje === 'function') clearMensaje();
    }
    
  }, [open, fetchUsuarios, clearMensaje]);



  // total count returned by backend
  const [total, setTotal] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (!query || !query.trim()) return usuarios;
    const q = query.trim().toLowerCase();
    return usuarios.filter(u => {
      const nombre = (u.nombre || '').toString().toLowerCase();
      const apellido = (u.apellido || '').toString().toLowerCase();
      const email = (u.email || '').toString().toLowerCase();
      const dni = (u.dni || '').toString().toLowerCase();
      return nombre.includes(q) || apellido.includes(q) || email.includes(q) || dni.includes(q);
    });
  }, [usuarios, query]);

  function openEdit(u) {
    // Fetch full user details to ensure array fields (especialidades) are populated
    (async () => {
      try {
        const token = localStorage.getItem('token');
        const url = `${API_BASE_URL}/api/usuarios/${u._id || u.id}`;
        const res = await fetch(url, { cache: 'no-cache', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        const full = data.usuario || data;
        setEditUser(full);
        setEditForm({
          nombre: full.nombre || '',
          apellido: full.apellido || '',
          email: full.email || '',
          dni: full.dni || '',
          rol: full.rol || '',
          especialidades: Array.isArray(full.especialidades) ? full.especialidades.join(', ') : (full.especialidades || '')
        });
        setEditOpen(true);
      } catch (err) {
        console.error('Error cargando usuario completo para editar', err);
        // fallback to shallow user if full fetch fails
        setEditUser(u);
        setEditForm({ nombre: u.nombre || '', apellido: u.apellido || '', email: u.email || '', dni: u.dni || '', rol: u.rol || '', especialidades: Array.isArray(u.especialidades) ? u.especialidades.join(', ') : (u.especialidades || '') });
        setEditOpen(true);
      }
    })();
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  }

  async function submitEdit(e) {
    e.preventDefault();
    if (!editUser) return;
    setEditLoading(true);
    try {
      // Validate on client using Yup schema (partial for admin fields)
      setEditErrors({});
      try {
        // Build a minimal object matching administradorSchema expectations
        const toValidate = {
          nombre: editForm.nombre,
          apellido: editForm.apellido,
          email: editForm.email,
          dni: editForm.dni === '' ? null : editForm.dni,
          password: 'placeholder', // administradorSchema requires password field; provide dummy to satisfy schema for shared use
          confirmarPassword: 'placeholder',
          rol: editForm.rol
        };
        await administradorSchema.validate(toValidate, { abortEarly: false });
      } catch (validationErr) {
        // collect field errors and show inline
        const errors = {};
        if (validationErr && validationErr.inner && Array.isArray(validationErr.inner)) {
          validationErr.inner.forEach(item => {
            if (item.path) errors[item.path] = item.message;
          });
        } else if (validationErr.path) {
          errors[validationErr.path] = validationErr.message;
        }
        setEditErrors(errors);
        setEditLoading(false);
        return;
      }
      const token = localStorage.getItem('token');
      const payload = {
        nombre: editForm.nombre,
        apellido: editForm.apellido,
        email: editForm.email,
        dni: editForm.dni,
        rol: editForm.rol
      };
      if (editForm.especialidades) {
        if (Array.isArray(editForm.especialidades)) {
          payload.especialidades = editForm.especialidades.slice();
        } else {
          payload.especialidades = String(editForm.especialidades).split(',').map(s => s.trim()).filter(Boolean);
        }
      }
      const url = `${API_BASE_URL}/api/usuarios/${editUser._id || editUser.id}`;
      const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(payload) });
      if (!res.ok) {
        let text = '';
        try {
          const d = await res.json();
          text = JSON.stringify(d);
        } catch {
          try {
            text = await res.text();
          } catch {
            // ignore
          }
        }
        throw new Error(text || `Status ${res.status}`);
      }
      await res.json();
  notify('Usuario actualizado');
      setEditOpen(false);
      setEditUser(null);
      fetchUsuarios();
    } catch (err) {
      console.error('Error updating user', err);
      setError({ message: 'Error actualizando usuario: ' + (err.message || err) });
    } finally {
      setEditLoading(false);
    }
  }

  async function deactivateUser(u) {
    if (!u || !(u._id || u.id)) return;
    if (!confirm(`¿Desactivar al usuario ${u.nombre || ''} ${u.apellido || ''}?`)) return;
    try {
      // optimistic UX: show immediate feedback
  notify('Desactivando...');
      setError(null);
      const token = localStorage.getItem('token');
      const url = `${API_BASE_URL}/api/usuarios/${u._id || u.id}/desactivar`;
      const res = await fetch(url, { method: 'PATCH', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
      let body = null;
      try { body = await res.json(); } catch { body = null; }
      if (!res.ok) {
        // prefer server-provided error message
        const errMsg = (body && (body.error || body.mensaje)) ? (body.error || body.mensaje) : `Error ${res.status}`;
        setError({ message: 'Error desactivando usuario: ' + errMsg, details: body && body.detalles ? body.detalles : undefined });
        return;
      }
      // success - show server message if provided
  const successMsg = (body && (body.mensaje || body.message)) ? (body.mensaje || body.message) : 'Usuario desactivado';
  notify(successMsg);
      fetchUsuarios();
    } catch (err) {
      console.error('Error deactivating user', err);
      setError({ message: 'Error desactivando usuario: ' + (err.message || err) });
    }
  }

  return (
    <ModalVentana open={open} onClose={onClose} titulo="Usuarios registrados">
  <NotificationManager />

      <div className="verusuarios-root">
        <div className="verusuarios-header">
          <h3>Usuarios registrados {total !== null ? `(${total})` : ''}</h3>
          <p className="verusuarios-sub">Profesores y Jefes de Área (la cuenta de administrador también puede verse aquí)</p>
        </div>

        <div className="verusuarios-actions">
          <SearchBar value={query} onChange={setQuery} placeholder="Buscar por nombre, apellido, email o DNI..." />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn-secondary" onClick={() => { setError(null); if (typeof clearMensaje === 'function') clearMensaje(); fetchUsuarios(); }}>Recargar</button>
          </div>
        </div>

        <div className="verusuarios-table-wrap">
          {loading ? (
            <div className="verusuarios-loading">Cargando...</div>
          ) : error ? (
            <div style={{ padding: 12 }}>
              <div style={{ color: '#b00020', marginBottom: 8 }}>{error.message}</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" onClick={() => { setError(null); fetchUsuarios(); }}>Reintentar</button>
                <button className="btn-secondary" onClick={() => { setError(null); }}>Cerrar error</button>
              </div>
            </div>
          ) : (
            <table className="verusuarios-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th>DNI</th>
                  <th>Rol</th>
                  <th>Especialidades</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '1rem' }}>No hay usuarios</td></tr>
                ) : filtered.map(u => (
                  <tr key={u._id || u.id} className={u.activo === false ? 'row-inactive' : ''}>
                    <td>{u.nombre}</td>
                    <td>{u.apellido}</td>
                    <td>{u.email}</td>
                    <td>{u.dni}</td>
                    <td>{u.rol}</td>
                    <td>{Array.isArray(u.especialidades) ? u.especialidades.join(', ') : (u.especialidades || '')}</td>
                    <td className="actions-td">
                      <button className="btn-link" onClick={() => openEdit(u)}>Editar</button>
                      <button className="btn-link danger" onClick={() => deactivateUser(u)}>Desactivar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Edit modal nested */}
        <ModalVentana open={editOpen} onClose={() => { setEditOpen(false); setEditUser(null); }} titulo={editUser ? `Editar ${editUser.nombre || ''}` : 'Editar usuario'}>
          {editLoading ? (
            <div style={{ padding: 12 }}>Guardando...</div>
          ) : (
            <form className="verusuarios-edit-form" onSubmit={submitEdit}>
              <div className="grid-edit">
                <div>
                  <input name="nombre" placeholder="Nombre" value={editForm.nombre || ''} onChange={handleEditChange} />
                  {editErrors.nombre && <div className="field-error">{editErrors.nombre}</div>}
                </div>
                <div>
                  <input name="apellido" placeholder="Apellido" value={editForm.apellido || ''} onChange={handleEditChange} />
                  {editErrors.apellido && <div className="field-error">{editErrors.apellido}</div>}
                </div>
                <div>
                  <input name="email" placeholder="Email" value={editForm.email || ''} onChange={handleEditChange} />
                  {editErrors.email && <div className="field-error">{editErrors.email}</div>}
                </div>
                <div>
                  <input name="dni" placeholder="DNI" value={editForm.dni || ''} onChange={handleEditChange} />
                  {editErrors.dni && <div className="field-error">{editErrors.dni}</div>}
                </div>
                <div>
                  <select name="rol" value={editForm.rol || ''} onChange={handleEditChange}>
                    <option value="administrador">Administrador</option>
                    <option value="profesor">Profesor</option>
                    <option value="jefe_area">Jefe de Área</option>
                  </select>
                  {editErrors.rol && <div className="field-error">{editErrors.rol}</div>}
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    {availableEspecialidades.map(sp => {
                      const checked = Array.isArray(editForm.especialidades) ? editForm.especialidades.includes(sp) : (String(editForm.especialidades || '').split(',').map(s => s.trim()).filter(Boolean).includes(sp));
                      return (
                        <label key={sp} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input type="checkbox" name="especialidades" value={sp} checked={checked} onChange={(e) => {
                            const val = e.target.value;
                            setEditForm(f => {
                              const current = Array.isArray(f.especialidades) ? f.especialidades.slice() : (String(f.especialidades || '').split(',').map(s => s.trim()).filter(Boolean));
                              if (e.target.checked) {
                                if (!current.includes(val)) current.push(val);
                              } else {
                                const idx = current.indexOf(val);
                                if (idx >= 0) current.splice(idx, 1);
                              }
                              return { ...f, especialidades: current };
                            });
                          }} />
                          <span style={{ fontSize: 14 }}>{sp}</span>
                        </label>
                      );
                    })}
                  </div>
                  {editErrors.especialidades && <div className="field-error">{editErrors.especialidades}</div>}
                </div>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                <button className="btn-primary" type="submit">Guardar</button>
                <button className="btn-secondary" type="button" onClick={() => { setEditOpen(false); setEditUser(null); }}>Cancelar</button>
              </div>
            </form>
          )}
        </ModalVentana>
      </div>
    </ModalVentana>
  );
}

export default VerUsuariosModal;
