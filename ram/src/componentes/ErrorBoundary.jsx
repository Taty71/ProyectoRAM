import React from "react";
import "../estilos/colores.css";
import "../estilos/errorBoundary.css";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Guardar detalles del error para debugging
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Loguear error en desarrollo
    if (import.meta.env.MODE === "development") {
      console.error("ErrorBoundary capturó un error:", error, errorInfo);
    }

    // En producción, podrías enviar el error a un servicio de logging
    // como Sentry, LogRocket, etc.
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-boundary-icon">⚠️</div>
            <h2 className="error-boundary-title">¡Ups! Algo salió mal</h2>
            <p className="error-boundary-message">
              Ha ocurrido un error inesperado en la aplicación.
            </p>
            <div className="error-boundary-actions">
              <button 
                onClick={this.handleReload}
                className="error-boundary-button"
              >
                🔄 Recargar página
              </button>
              <button 
                onClick={() => window.history.back()}
                className="error-boundary-button secondary"
              >
                ← Volver atrás
              </button>
            </div>
            {import.meta.env.MODE === "development" && this.state.error && (
              <details className="error-boundary-details">
                <summary>Detalles técnicos (solo en desarrollo)</summary>
                <pre className="error-boundary-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
