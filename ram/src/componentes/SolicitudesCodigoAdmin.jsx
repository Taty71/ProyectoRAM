import { useEffect, useState, useCallback } from "react"; // Agregar useCallback
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import NotificationManager from "../utils/NotificationManager";
import "../estilos/SolicitudesCodigoAdmin.css";

function SolicitudesCodigoAdmin({ institucionNombre, institucionId }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { clearError } = useErrorHandler();
  const [mensaje, setMensaje] = useState("");
  const [errorNotif, setErrorNotif] = useState(null);
  const [confirmNotif, setConfirmNotif] = useState(null);
  
  // Modal de aprobación
  const [modalAprobar, setModalAprobar] = useState(null);
  const [usos, setUsos] = useState(1);
  const [diasExpiracion, setDiasExpiracion] = useState(30);
  const [procesando, setProcesando] = useState(false);

  // Usar useCallback para evitar el warning
  const cargarSolicitudes = useCallback(() => {
  setLoading(true);
  fetch("http://localhost:3000/api/auth/solicitudes-codigo")
    .then(res => res.json())
    .then(data => {
      let solicitudesFiltradas = data.solicitudes || [];
      
      // Filtrar solo si hay institucionId Y si la solicitud tiene el campo institucion
      if (institucionId) {
        solicitudesFiltradas = solicitudesFiltradas.filter(s => {
          // Si tiene institucion._id, comparar con eso
          if (s.institucion && s.institucion._id) {
            return s.institucion._id === institucionId;
          }
          // Si NO tiene institucion pero tiene institucionNombre, también incluirla
          // (para las solicitudes antiguas que no tienen el campo institucion)
          return s.institucionNombre && s.institucionNombre.includes("IPET 379");
        });
      }
      
      console.log("Solicitudes filtradas:", solicitudesFiltradas);
      setSolicitudes(solicitudesFiltradas);
      setLoading(false);
    })
    .catch(err => {
      console.error("Error cargando solicitudes:", err);
      setErrorNotif({ message: "Error al cargar solicitudes" });
      setLoading(false);
    });
}, [institucionId]);

  useEffect(() => {
    cargarSolicitudes();
  }, [cargarSolicitudes]); // Ahora incluir cargarSolicitudes

  
  const abrirModalAprobar = (solicitud) => {
    setModalAprobar(solicitud);
    setUsos(1);
    setDiasExpiracion(30);
  };

  const aprobarSolicitud = async () => {
    if (!modalAprobar) return;
    
    setProcesando(true);
    clearError();
    
    try {
      const res = await fetch("http://localhost:3000/api/auth/generar-enviar-codigo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          solicitudId: modalAprobar._id,
          usos: usos,
          diasExpiracion: diasExpiracion
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMensaje(`✅ Código ${data.codigo} generado y enviado a ${data.email}`);
        setModalAprobar(null);
        cargarSolicitudes(); // Recargar lista
      } else {
        setErrorNotif({ message: data.error || "Error al generar código" });
      }
    } catch (error) {
      console.error("Error al aprobar solicitud:", error);
      setErrorNotif({ message: "Error de conexión al aprobar solicitud" });
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
    <div className="solicitudes-codigo-admin">
      <h2>📨 Solicitudes de Código de Invitación</h2>
      
      <NotificationManager
        error={errorNotif}
        mensaje={mensaje}
        onClearError={() => setErrorNotif(null)}
        onClearMensaje={() => setMensaje("")}
        autoHide={true}
        hideDelay={4000}
      />

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
          <div className="modal-content" onClick={e => e.stopPropagation()}> 
            <h3>✅ Aprobar Solicitud de Código</h3>
            
            <div className="solicitud-details">
              <p><strong>Usuario:</strong> {modalAprobar.nombre} {modalAprobar.apellido}</p>
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
                <th>Email</th>
                <th>Rol</th>
                <th>Institución</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {solicitudes.map(s => (
                <tr key={s._id} className={s.estado === 'aprobada' ? 'solicitud-aprobada' : ''}>
                  <td>{s.nombre}</td>
                  <td>{s.apellido}</td>
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
                  <td>{s.institucionNombre || s.institucion?.nombre || institucionNombre || "No especificada"}</td>
                  <td>{new Date(s.fecha).toLocaleString()}</td>
                  <td>
                    <span className={`estado-badge estado-${s.estado || 'pendiente'}`}> 
                      {s.estado || 'pendiente'}
                    </span>
                  </td>
                  <td>
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