import { useEffect, useState } from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import NotificationManager from "../utils/NotificationManager";

function SolicitudesCodigoAdmin({ institucionNombre }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clearError } = useErrorHandler();
  const [mensaje, setMensaje] = useState("");
  const [errorNotif, setErrorNotif] = useState(null);
  const [confirmNotif, setConfirmNotif] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/auth/solicitudes-codigo")
      .then(res => res.json())
      .then(data => {
        setSolicitudes(data.solicitudes || []);
        setLoading(false);
      });
  }, []);

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
        setMensaje("Solicitud eliminada correctamente.");
      } else {
        const err = await ErrorHandler.processApiError(res, "No se pudo eliminar la solicitud");
        setErrorNotif(err);
      }
    } catch (e) {
      setErrorNotif(ErrorHandler.processNetworkError(e, "Error de conexión al eliminar."));
    }
  };

  return (
    <div className="solicitudes-codigo-admin" style={{ fontSize: '0.97em', position: 'relative' }}>
      <h2 style={{ fontSize: '1.25em', display: 'flex', alignItems: 'center', gap: '0.5em' }}>📨 Solicitudes de código de invitación</h2>
      <NotificationManager
        error={errorNotif}
        mensaje={mensaje}
        onClearError={() => setErrorNotif(null)}
        onClearMensaje={() => setMensaje("")}
        autoHide={true}
        hideDelay={3500}
      />
      {confirmNotif && confirmNotif.tipo === "warning" && (
        <div className="notification-container">
          <div className="notification notification-warning" style={{ minWidth: '260px' }}>
            <div className="notification-content">
              <div className="notification-icon">⚠️</div>
              <div className="notification-message">
                <div className="notification-title">Confirmar eliminación</div>
                <div className="notification-text">{confirmNotif.mensaje}</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1em', marginTop: '1em' }}>
              <button style={{ background: '#c0392b', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 18px', cursor: 'pointer' }} onClick={() => confirmarEliminar(confirmNotif.id)}>Eliminar</button>
              <button style={{ background: '#eee', color: '#333', border: 'none', borderRadius: '6px', padding: '6px 18px', cursor: 'pointer' }} onClick={() => setConfirmNotif(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
      {loading ? <p>Cargando...</p> : solicitudes.length === 0 ? <p>No hay solicitudes pendientes.</p> : (
        <table style={{ fontSize: '0.97em' }}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Institución</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map(s => (
              <tr key={s._id}>
                <td>
                  {s.nombre}
                  <button
                    style={{ marginLeft: '0.5rem', fontSize: '0.9em', padding: '2px 8px', cursor: 'pointer' }}
                    title="Copiar nombre"
                    onClick={() => {
                      navigator.clipboard.writeText(s.nombre);
                    }}
                  >📋</button>
                </td>
                <td>
                  {s.apellido}
                  <button
                    style={{ marginLeft: '0.5rem', fontSize: '0.9em', padding: '2px 8px', cursor: 'pointer' }}
                    title="Copiar apellido"
                    onClick={() => {
                      navigator.clipboard.writeText(s.apellido);
                    }}
                  >📋</button>
                </td>
                <td>
                  {s.email}
                  <button
                    style={{ marginLeft: '0.5rem', fontSize: '0.9em', padding: '2px 8px', cursor: 'pointer' }}
                    title="Copiar email"
                    onClick={() => {
                      navigator.clipboard.writeText(s.email);
                    }}
                  >📋</button>
                </td>
                <td>
                  {s.rol}
                  <button
                    style={{ marginLeft: '0.5rem', fontSize: '0.9em', padding: '2px 8px', cursor: 'pointer' }}
                    title="Copiar rol"
                    onClick={() => {
                      navigator.clipboard.writeText(s.rol);
                    }}
                  >📋</button>
                </td>
                {/* motivo eliminado */}
                <td>{s.institucionNombre || s.institucion?.nombre || institucionNombre || "No especificada"}</td>
                <td>{new Date(s.fecha).toLocaleString()}</td>
                <td>{s.estado}</td>
                <td>
                  <button
                    style={{ background: '#ffeaea', color: '#c0392b', border: 'none', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '1em' }}
                    title="Eliminar solicitud"
                    onClick={() => eliminarSolicitud(s._id)}
                  >🗑️ Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default SolicitudesCodigoAdmin;
