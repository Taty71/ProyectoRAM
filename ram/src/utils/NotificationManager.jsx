import React from "react";
import "../estilos/notificaciones.css";

function NotificationManager({ 
  error, 
  mensaje, 
  onClearError, 
  onClearMensaje,
  autoHide = true,
  hideDelay = 5000 
}) {
  
  // Auto-hide para mensajes de éxito
  // Agregar después del useEffect existente (línea 21)

// Auto-hide para errores también (opcional)
React.useEffect(() => {
  if (error && autoHide && onClearError) {
    const timer = setTimeout(() => {
      onClearError();
    }, hideDelay + 2000); // Dar más tiempo a los errores
    return () => clearTimeout(timer);
  }
}, [error, autoHide, hideDelay, onClearError]);

  if (!error && !mensaje) return null;

  return (
    <div className="notification-container">
      {error && (
        <div className={`notification notification-error ${error.type ? `notification-${error.type}` : ''}`}>
          <div className="notification-content">
            <div className="notification-icon">⚠️</div>
            <div className="notification-message">
              <div className="notification-title">Error</div>
              <div className="notification-text">
                {typeof error === 'string' ? error : error.message}
              </div>
              {Array.isArray(error.details) && error.details.length > 0 && (
                <div className="notification-details">
                  {error.details.map((detail, index) => (
                    <div key={index} className="notification-detail-item">
                      {detail}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {onClearError && (
            <button 
              className="notification-close" 
              onClick={onClearError}
              aria-label="Cerrar error"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {mensaje && (
        <div className="notification notification-success">
          <div className="notification-content">
            <div className="notification-icon">✅</div>
            <div className="notification-message">
              <div className="notification-title">Éxito</div>
              <div className="notification-text">{mensaje}</div>
            </div>
          </div>
          {onClearMensaje && (
            <button 
              className="notification-close" 
              onClick={onClearMensaje}
              aria-label="Cerrar mensaje"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationManager;