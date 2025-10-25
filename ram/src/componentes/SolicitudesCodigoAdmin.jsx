import { useEffect, useState, useCallback } from "react"; // Agregar useCallback
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import NotificationManager from "../utils/NotificationManager";
import { useNotification } from '../hooks/useNotification';
import "../estilos/SolicitudesCodigoAdmin.css";

function SolicitudesCodigoAdmin({ institucionNombre, institucionId }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clearError } = useErrorHandler();
  const { notify, notifyError } = useNotification();
  const [confirmNotif, setConfirmNotif] = useState(null);
  
  // Modal de aprobación
  const [modalAprobar, setModalAprobar] = useState(null);
  const [usos, setUsos] = useState(1);
  const [diasExpiracion, setDiasExpiracion] = useState(30);
  const [instituciones, setInstituciones] = useState([]);
  const [institucionSeleccionada, setInstitucionSeleccionada] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [forceApproveLocal] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  // Usar useCallback para evitar el warning
  const cargarSolicitudes = useCallback(() => {
  setLoading(true);
  fetch("http://localhost:3000/api/auth/solicitudes-codigo")
    .then(res => res.json())
    .then(data => {
      let solicitudesFiltradas = data.solicitudes || [];
      
      // Filtrar por contexto de institución:
      // - Si se pasa `institucionId` (prop), mostrar sólo solicitudes de esa institución.
      // - Si no hay `institucionId` pero existe `institucionNombre` (prop/local), filtrar por nombre (case-insensitive).
      // - Si no hay contexto, mostrar todas las solicitudes.
      if (institucionId) {
        solicitudesFiltradas = solicitudesFiltradas.filter(s => {
          if (s.institucion && s.institucion._id) return s.institucion._id === institucionId;
          if (s.institucion && s.institucion._id === undefined && s.institucionNombre) {
            // comparar por institucionNombre en la solicitud
            return s.institucionNombre && s.institucionNombre.toLowerCase().includes((institucionNombre || '').toLowerCase());
          }
          return false;
        });
      } else if (institucionNombre) {
        const filtro = institucionNombre.toLowerCase();
        solicitudesFiltradas = solicitudesFiltradas.filter(s => {
          const nombreSolicitud = (s.institucionNombre || (s.institucion && s.institucion.nombre) || '').toLowerCase();
          return nombreSolicitud.includes(filtro);
        });
      }
      
      console.log("Solicitudes filtradas:", solicitudesFiltradas);
      setSolicitudes(solicitudesFiltradas);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error cargando solicitudes:", err);
      notifyError('Error al cargar solicitudes');
      setLoading(false);
    });
}, [institucionId, institucionNombre, notifyError]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]); // Ahora incluir cargarSolicitudes

  // Cargar lista de instituciones para que el admin pueda elegir si la solicitud no tiene institución
  useEffect(() => {
    fetch('http://localhost:3000/api/instituciones/activa')
      .then(res => res.json())
      .then(data => setInstituciones(data.instituciones || []))
      .catch(err => console.error('Error cargando instituciones:', err));
  }, []);

  
  const abrirModalAprobar = (solicitud) => {
    setModalAprobar(solicitud);
    setUsos(1);
    setDiasExpiracion(30);
    setInstitucionSeleccionada(null);
  };

  // Determine if current user can approve: admin role in localStorage OR force via URL (for testing)
  const currentRole = (localStorage.getItem('rol') || '').toString().toLowerCase();
  const forceApprove = typeof window !== 'undefined' && window.location && window.location.search && window.location.search.indexOf('forceApprove=1') !== -1;
  // approval control (not used to hide button now; kept for future):
  const _canApprove = currentRole === 'administrador' || currentRole === 'admin' || forceApprove || forceApproveLocal;

  const aprobarSolicitud = async () => {
    if (!modalAprobar) return;
    
    setProcesando(true);
    clearError();
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch("http://localhost:3000/api/auth/generar-enviar-codigo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          solicitudId: modalAprobar._id,
          usos: usos,
          diasExpiracion: diasExpiracion,
          institucionId: institucionSeleccionada || null
        })
      });

      const data = await res.json();

      if (res.ok) {
        // mostrar y copiar código
        const mensaje = `✅ Código ${data.codigo} generado y enviado a ${data.email}`;
        notify(mensaje);
        try {
          if (navigator && navigator.clipboard && data.codigo) {
            await navigator.clipboard.writeText(data.codigo);
            notify('Código copiado al portapapeles');
          }
  } catch { /* ignore clipboard errors */ }
        // set success result for modal
        setSuccessResult({ codigo: data.codigo, email: data.email, nombre: modalAprobar.nombre, apellido: modalAprobar.apellido, dni: modalAprobar.dni, rol: modalAprobar.rol });
        setModalAprobar(null);
        cargarSolicitudes(); // Recargar lista
      } else {
        notifyError(data.error || "Error al generar código");
      }
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
      notifyError('Error de conexión al aprobar solicitud');
    } finally {
      setProcesando(false);
    }
  };

  const eliminarSolicitud = (id) => {
    setConfirmNotif({
      tipo: "warning",
      mensaje: "¿Seguro que deseas eliminar esta solicitud?",
      id
    });
  };

  const confirmarEliminar = async (id) => {
    clearError();
    setConfirmNotif(null);
    try {
      const res = await fetch(`http://localhost:3000/api/auth/solicitudes-codigo/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setSolicitudes(solicitudes.filter(s => s._id !== id));
        notify('Solicitud eliminada correctamente.');
      } else {
        const err = await ErrorHandler.processApiError(res, "No se pudo eliminar la solicitud");
        notifyError(err.message || 'No se pudo eliminar la solicitud');
      }
    } catch (e) {
      notifyError(ErrorHandler.processNetworkError(e, "Error de conexión al eliminar.").message || 'Error de conexión al eliminar.');
    }
  };

  return (
    <div className="solicitudes-codigo-admin">
      <h2>📨 Solicitudes de Código de Invitación</h2>
      
      <NotificationManager autoHide={true} hideDelay={4000} />

      {/* Modal de confirmación de eliminación */}
      {confirmNotif && confirmNotif.tipo === "warning" && (
        <div className="modal-overlay" onClick={() => setConfirmNotif(null)}>
          <div className="modal-content-small" onClick={e => e.stopPropagation()}>
            <h3>⚠️ Confirmar eliminación</h3>
            <p>{confirmNotif.mensaje}</p>
            <div className="modal-actions">
              <button className="btn-confirmar-eliminar" onClick={() => confirmarEliminar(confirmNotif.id)}>
                Eliminar
              </button>
              <button className="btn-cancelar" onClick={() => setConfirmNotif(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de aprobación */}
      {modalAprobar && (
        <div className="modal-overlay" onClick={() => !procesando && setModalAprobar(null)}>
          <div className="modal-content modal-wide" onClick={e => e.stopPropagation()}> 
            <h3>✅ Aprobar Solicitud de Código</h3>
            
            <div className="solicitud-details">
              <p><strong>Usuario:</strong> {modalAprobar.nombre} {modalAprobar.apellido}</p>
              <p><strong>DNI:</strong> {modalAprobar.dni || 'No provisto'}</p>
              <p><strong>Email:</strong> {modalAprobar.email}</p>
              <p><strong>Rol:</strong> {modalAprobar.rol}</p>
              <p><strong>Institución:</strong> {modalAprobar.institucionNombre || "No especificada"}</p>
            </div>

            <div className="form-group">
              <label>Número de usos del código:</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={usos}
                onChange={e => setUsos(parseInt(e.target.value) || 1)}
                disabled={procesando}
              />
              <small>Cantidad de veces que se puede usar el código</small>
            </div>

            {/* Si la solicitud no tiene institución definida, permitir que el admin elija una */}
            {(!modalAprobar.institucion || !modalAprobar.institucion._id) && (
              <div className="form-group">
                <label>Seleccionar institución (opcional)</label>
                <select value={institucionSeleccionada || ''} onChange={e => setInstitucionSeleccionada(e.target.value)} disabled={procesando}>
                  <option value="">-- Usar institución de la solicitud --</option>
                  {instituciones.map(inst => (
                    <option key={inst._id} value={inst._id}>{inst.nombre}</option>
                  ))}
                </select>
                <small>Si no seleccionas, se intentará resolver por nombre</small>
              </div>
            )}

            <div className="form-group">
              <label>Días hasta expiración:</label>
              <input 
                type="number" 
                min="1" 
                max="365"
                value={diasExpiracion}
                onChange={e => setDiasExpiracion(parseInt(e.target.value) || 1)}
                disabled={procesando}
              />
              <small>El código expirará en {diasExpiracion} días</small>
            </div>

            <div className="modal-actions">
              <button 
                className="btn-aprobar-confirmar" 
                onClick={aprobarSolicitud}
                disabled={procesando}
              >
                {procesando ? "Generando..." : "Generar y Enviar Código"}
              </button>
              <button 
                className="btn-cancelar" 
                onClick={() => setModalAprobar(null)}
                disabled={procesando}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Success modal after generating code */}
      {successResult && (
        <div className="modal-overlay" onClick={() => setSuccessResult(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>✅ Código generado</h3>
            <p>Se generó el código y se envió por email a: <strong>{successResult.email}</strong></p>
            <div style={{ margin: '1rem 0', padding: '1rem', background: '#f8f9fa', borderRadius: 8 }}>
              <p><strong>Código:</strong> <span style={{ fontFamily: 'monospace', fontSize: '1.2rem' }}>{successResult.codigo}</span></p>
              <p><strong>Nombre:</strong> {successResult.nombre} {successResult.apellido}</p>
              <p><strong>DNI:</strong> {successResult.dni || 'No provisto'}</p>
              <p><strong>Rol:</strong> {successResult.rol}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-aprobar-confirmar" onClick={async () => { try { await navigator.clipboard.writeText(successResult.codigo); notify('Código copiado'); } catch { /* ignore clipboard errors */ } }}>Copiar código</button>
              <button className="btn-cancelar" onClick={() => setSuccessResult(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {/* Tabla de solicitudes */}
      {loading ? (
        <p>Cargando solicitudes...</p>
      ) : solicitudes.length === 0 ? (
        <p className="no-solicitudes">No hay solicitudes pendientes</p>
      ) : (
        <div className="tabla-container">
          <table className="tabla-solicitudes">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>DNI</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Fecha</th>
                <th>Acciones</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(s => (
                <tr key={s._id} className={s.estado === 'aprobada' ? 'solicitud-aprobada' : ''}>
                  <td>{s.nombre}</td>
                  <td>{s.apellido}</td>
                  <td className="dni-cell">
                    <span className="dni-text">{s.dni || 'No provisto'}</span>
                    <button
                      className="btn-copiar btn-copiar-dni"
                      title="Copiar DNI"
                      onClick={() => navigator.clipboard.writeText(s.dni || '')}
                    >
                      📋
                    </button>
                  </td>
                  <td>
                    {s.email}
                    <button
                      className="btn-copiar"
                      title="Copiar email"
                      onClick={() => navigator.clipboard.writeText(s.email)}
                    >
                      📋
                    </button>
                  </td>
                  <td>{s.rol}</td>
                  <td>{new Date(s.fecha).toLocaleString()}</td>
                  <td className="acciones-column">
                    <div className="acciones-group">
                      {s.estado !== 'aprobada' && (
                        <button
                          className="btn-aprobar"
                          title="Aprobar solicitud"
                          onClick={() => abrirModalAprobar(s)}
                        >
                          ✓ Aprobar
                        </button>
                      )}
                      <button
                        className="btn-eliminar"
                        title="Eliminar solicitud"
                        onClick={() => eliminarSolicitud(s._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                  <td>
                    <span className={`estado-badge estado-${s.estado || 'pendiente'}`}> 
                      {s.estado || 'pendiente'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SolicitudesCodigoAdmin;