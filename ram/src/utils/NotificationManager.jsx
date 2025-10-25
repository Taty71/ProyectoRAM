import React from "react";
import { createPortal } from 'react-dom';
import "../estilos/notificaciones.css";
import { useNotificationSafe } from '../hooks/useNotification';

function NotificationManager({ 
  error: propError, 
  mensaje: propMensaje, 
  onClearError: propOnClearError, 
  onClearMensaje: propOnClearMensaje,
  autoHide = true,
  hideDelay = 24000 // Duplicado: 24s
}) {
  // Prevent multiple rendered instances: only the first mounted manager will actually render
  // This helps when some pages also include <NotificationManager />; the global one in main.jsx should win.
  if (typeof window !== 'undefined') {
    if (!window.__ram_notification_manager_mounts) window.__ram_notification_manager_mounts = 0;
  }

  // always call hooks unconditionally
  const ctx = useNotificationSafe();

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    window.__ram_notification_manager_mounts = (window.__ram_notification_manager_mounts || 0) + 1;
    return () => { window.__ram_notification_manager_mounts = (window.__ram_notification_manager_mounts || 1) - 1; };
  }, []);

  const error = propError === undefined ? (ctx ? ctx.error : null) : propError;
  const mensaje = propMensaje === undefined ? (ctx ? ctx.mensaje : '') : propMensaje;
  const onClearError = propOnClearError === undefined ? (ctx ? ctx.clearError : null) : propOnClearError;
  const onClearMensaje = propOnClearMensaje === undefined ? (ctx ? ctx.clearMensaje : null) : propOnClearMensaje;

  // Auto-hide success mensaje
  React.useEffect(() => {
    if (mensaje && autoHide && onClearMensaje) {
      const t = setTimeout(() => onClearMensaje(), hideDelay);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [mensaje, autoHide, hideDelay, onClearMensaje]);

  // Auto-hide errors (give them a bit more time)
  React.useEffect(() => {
    if (error && autoHide && onClearError) {
      const t = setTimeout(() => onClearError(), hideDelay + 2000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [error, autoHide, hideDelay, onClearError]);

  // Debug logging (non-essential)
  React.useEffect(() => {
    if (mensaje) console.info('[NotificationManager] mensaje:', mensaje);
    if (error) console.info('[NotificationManager] error:', error);
  }, [mensaje, error]);

  // trace render events for debugging visibility issues
  React.useEffect(() => {
    if (mensaje || error) console.info('[NotificationManager] rendering UI (mensaje/error present)');
  }, [mensaje, error]);

  // Ensure we render the notifications into a dedicated top-level DOM node (portal)
  const [host, setHost] = React.useState(null);
  React.useEffect(() => {
    if (typeof document === 'undefined') return;
    let root = document.getElementById('ram-notifications-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'ram-notifications-root';
      document.body.appendChild(root);
      console.info('[NotificationManager] created portal root #ram-notifications-root');
    } else {
      console.info('[NotificationManager] using existing portal root #ram-notifications-root');
    }
    setHost(root);
  }, []);
  if (!error && !mensaje) return null;

  // if there's more than one instance mounted, only allow the first to render UI
  // Previously we avoided rendering when there were multiple mounted instances.
  // That logic caused a situation where, once a second manager mounted, all managers
  // stopped rendering and no notifications were visible. It's safer to allow rendering
  // whenever there is an error/mensaje available (the app normally mounts a single
  // global manager in main.jsx). Keep mounts bookkeeping but always render when needed.

  const node = (
    <div className="notification-container">
      {error && (
        <div className={`notification notification-error ${error && error.type ? `notification-${error.type}` : ''}${window.__ram_debug_notifications ? ' debug-visible' : ''}`}>
          <div className="notification-content">
            <div className="notification-icon">⚠️</div>
            <div className="notification-message">
              <div className="notification-title">Error</div>
              <div className="notification-text">{typeof error === 'string' ? error : (error && error.message)}</div>
              {error && Array.isArray(error.details) && error.details.length > 0 && (
                <div className="notification-details">
                  {error.details.map((detail, idx) => (
                    <div key={idx} className="notification-detail-item">{detail}</div>
                  ))}
                </div>
              )}
              {error && !Array.isArray(error.details) && error.details && (
                <div className="notification-details">
                  <div className="notification-detail-item">{String(error.details)}</div>
                </div>
              )}
            </div>
          </div>
          {onClearError && (
            <button className="notification-close" onClick={onClearError} aria-label="Cerrar error">✕</button>
          )}
        </div>
      )}

      {mensaje && (
        <div className={`notification notification-success${window.__ram_debug_notifications ? ' debug-visible' : ''}`}>
          <div className="notification-content">
            <div className="notification-icon">✅</div>
            <div className="notification-message">
              <div className="notification-title">Éxito</div>
              <div className="notification-text">{mensaje}</div>
            </div>
          </div>
          {onClearMensaje && (
            <button className="notification-close" onClick={onClearMensaje} aria-label="Cerrar mensaje">✕</button>
          )}
        </div>
      )}
    </div>
  );

  if (host) return createPortal(node, host);
  return node;
}

export default NotificationManager;