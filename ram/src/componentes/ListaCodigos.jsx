import React from "react";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
 import NotificationManager from "../utils/NotificationManager";
 import { useNotification } from '../hooks/useNotification';
import "../estilos/listaCodigos.css";

function ListaCodigos() {
  const [codigos, setCodigos] = React.useState([]);
  const { error, clearError, setError } = useErrorHandler();
  const { notifyError } = useNotification();
  const [cargando, setCargando] = React.useState(false);

  React.useEffect(() => {
    const fetchCodigos = async () => {
      setCargando(true);
      clearError();
      try {
        const token = localStorage.getItem("token");
        const data = await ErrorHandler.handleFetch(
          "http://localhost:3000/api/auth/codigos-invitacion",
          {
            headers: {
              "Authorization": `Bearer ${token}`
            },
            // Evitar respuestas 304 en caché que pueden confundir la UI
            cache: 'no-cache'
          },
          "Error cargando códigos"
        );
         setCodigos(data.codigos || []);
         } catch (errorObj) {
         // Usar setError del hook para mostrar notificación correctamente
         setError(errorObj);
         notifyError(ErrorHandler.formatErrorMessage(errorObj) || "Error cargando códigos");
      } finally {
        setCargando(false);
      }
    };
    fetchCodigos();
  // Los hooks usados en este efecto (clearError, setError, notifyError) están memoizados
  // en sus respectivos providers/hooks (useErrorHandler, useNotification), por lo que
  // es intencional que el efecto se ejecute solo en el montaje.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="lista-codigos-container">
      <h3>Lista de códigos de invitación</h3>
      <div className="codigos-lista">
        {cargando ? (
          <p>Cargando...</p>
        ) : codigos.length === 0 ? (
          <p>No hay códigos para mostrar.</p>
        ) : (
          <table className="tabla-codigos">
            <thead>
              <tr>
                <th>Código</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Usos</th>
                <th>Expira</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {codigos.map(codigo => (
                <tr key={codigo._id}>
                  <td>{codigo.codigo}</td>
                  <td>{codigo.email}</td>
                  <td>{codigo.rol}</td>
                  <td>{codigo.usosRestantes} / {codigo.usosMaximos}</td>
                  <td>{codigo.fechaExpiracion ? new Date(codigo.fechaExpiracion).toLocaleString() : "Sin expiración"}</td>
                  <td>{codigo.activo ? "Activo" : "Desactivado"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <NotificationManager
        error={error}
        onClearError={clearError}
      />
    </div>
  );
}

export default ListaCodigos;
