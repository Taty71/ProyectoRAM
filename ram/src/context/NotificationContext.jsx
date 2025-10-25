import React, { createContext, useState, useCallback } from 'react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState(null);

  React.useEffect(() => {
    console.info('[NotificationProvider] mounted');
    return () => { console.info('[NotificationProvider] unmounted'); };
  }, []);

  const notify = useCallback((text) => {
    console.info('[Notification] notify ->', text);
    setMensaje(text);
    // auto-clear after 24s (duplicado)
    setTimeout(() => setMensaje(''), 24000);
  }, []);

  const notifyError = useCallback((err) => {
    console.info('[Notification] notifyError ->', err);
    // Normalize error object to have { message, details }
    let normalized = { message: 'Error', details: [] };
    if (!err) {
      normalized.message = 'Error desconocido';
    } else if (typeof err === 'string') {
      normalized.message = err;
    } else if (err instanceof Error) {
      normalized.message = err.message || 'Error';
      normalized.details = err.stack ? [err.stack] : [];
    } else if (typeof err === 'object') {
      normalized.message = err.message || (err.mensaje || 'Error');
      if (Array.isArray(err.details) && err.details.length) normalized.details = err.details;
      else if (err.details && typeof err.details === 'string') normalized.details = [err.details];
      else if (err.info && typeof err.info === 'string') normalized.details = [err.info];
      else if (err.error && typeof err.error === 'string') normalized.details = [err.error];
      else if (err.stack) normalized.details = [err.stack];
    }
    setError(normalized);
    // auto-clear after 28s (más tiempo para depurar)
    setTimeout(() => setError(null), 28000);
  }, []);

  const value = {
    mensaje,
    error,
    notify,
    notifyError,
    clearMensaje: () => setMensaje(''),
    clearError: () => setError(null)
  };

  // trace mensaje/error changes for debugging
  React.useEffect(() => {
    if (mensaje) console.info('[NotificationProvider] mensaje set ->', mensaje);
  }, [mensaje]);
  React.useEffect(() => {
    if (error) console.info('[NotificationProvider] error set ->', error);
  }, [error]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// hooks moved to ram/src/hooks/useNotification.js to avoid fast-refresh warnings

export default NotificationContext;
