// Configuración de la API
// Ajuste: el backend de desarrollo suele correr en el puerto 3000 en este workspace.
// Permitimos sobrescribir la URL con la variable de entorno Vite VITE_API_BASE_URL cuando sea necesario.
const envOverride = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL;
const DEFAULT_BACKEND_PORT = 3000;
const defaultUrl = window.location.protocol + '//' + window.location.hostname + `:${DEFAULT_BACKEND_PORT}`;
const API_BASE_URL = envOverride ? String(import.meta.env.VITE_API_BASE_URL) : defaultUrl;

export default API_BASE_URL;