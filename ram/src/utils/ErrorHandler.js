// ErrorHandler.js - Sistema centralizado de manejo de errores
import React from 'react';

export class ErrorHandler {
  // Tipos de errores predefinidos
  static ERROR_TYPES = {
    NETWORK: 'network',
    VALIDATION: 'validation',
    AUTH: 'auth',
    SERVER: 'server',
    GENERAL: 'general'
  };

  // Mapeo de códigos de estado HTTP a tipos de error
  static getErrorTypeByStatus(status) {
    if (status >= 400 && status < 500) {
      if (status === 401 || status === 403) return this.ERROR_TYPES.AUTH;
      if (status === 422) return this.ERROR_TYPES.VALIDATION;
      return this.ERROR_TYPES.GENERAL;
    }
    if (status >= 500) return this.ERROR_TYPES.SERVER;
    return this.ERROR_TYPES.GENERAL;
  }

  // Procesar error de fetch/API
  static async processApiError(response, defaultMessage = "Error en la operación") {
    try {
      const data = await response.json();
      const errorType = this.getErrorTypeByStatus(response.status);
      
      let message = data.error || data.message || defaultMessage;
      let details = null;

      // Procesar errores de validación
      if (data.detalles && Array.isArray(data.detalles)) {
        details = data.detalles.map(d => `• ${d.msg} (${d.param})`);
      }

      return {
        type: errorType,
        message,
        details,
        status: response.status,
        originalData: data
      };
    } catch {
      // Si no se puede parsear la respuesta
      return {
        type: this.getErrorTypeByStatus(response.status),
        message: defaultMessage,
        details: null,
        status: response.status
      };
    }
  }

  // Procesar error de red/conexión
  static processNetworkError(error, defaultMessage = "Error de conexión") {
    return {
      type: this.ERROR_TYPES.NETWORK,
      message: defaultMessage,
      details: null,
      originalError: error
    };
  }

  // Procesar error de validación local
  static processValidationError(message, field = null) {
    return {
      type: this.ERROR_TYPES.VALIDATION,
      message,
      field,
      details: null
    };
  }

  // Formatear mensaje de error para mostrar al usuario
  static formatErrorMessage(errorObject) {
    if (!errorObject) return "";

    let formattedMessage = errorObject.message;

    if (errorObject.details && errorObject.details.length > 0) {
      formattedMessage += "\n" + errorObject.details.join("\n");
    }

    return formattedMessage;
  }

  // Obtener clase CSS según el tipo de error
  static getErrorClass(errorObject) {
    if (!errorObject) return "error-general";
    
    const classMap = {
      [this.ERROR_TYPES.NETWORK]: "error-network",
      [this.ERROR_TYPES.VALIDATION]: "error-validation", 
      [this.ERROR_TYPES.AUTH]: "error-auth",
      [this.ERROR_TYPES.SERVER]: "error-server",
      [this.ERROR_TYPES.GENERAL]: "error-general"
    };

    return classMap[errorObject.type] || "error-general";
  }

  // Método helper para manejo completo de fetch
  static async handleFetch(url, options = {}, defaultErrorMessage = "Error en la operación") {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw await this.processApiError(response, defaultErrorMessage);
      }

      return await response.json();
    } catch (error) {
      // Si es un error ya procesado, re-lanzarlo
      if (error.type) {
        throw error;
      }
      // Si es un error de red, procesarlo
      throw this.processNetworkError(error, defaultErrorMessage);
    }
  }
}

// Hook personalizado para manejo de errores en componentes React
export function useErrorHandler() {
  const [error, setError] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const clearError = () => setError(null);

  const handleAsync = async (asyncFunction, loadingState = true) => {
    if (loadingState) setIsLoading(true);
    clearError();

    try {
      const result = await asyncFunction();
      return result;
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      if (loadingState) setIsLoading(false);
    }
  };

  const setValidationError = (message, field = null) => {
    setError(ErrorHandler.processValidationError(message, field));
  };

  return {
    error,
    isLoading,
    clearError,
    handleAsync,
    setValidationError,
    formatError: (errorObj) => ErrorHandler.formatErrorMessage(errorObj),
    getErrorClass: (errorObj) => ErrorHandler.getErrorClass(errorObj)
  };
}

export default ErrorHandler;