import React from "react";
import * as Yup from "yup";
import ErrorHandler, { useErrorHandler } from "../utils/ErrorHandler";
import NotificationManager from "../utils/NotificationManager";
import { useNotification } from '../hooks/useNotification';
import "../estilos/crearCodigo.css";

const codigoSchema = Yup.object().shape({
  nombre: Yup.string().required("El nombre es obligatorio"),
  apellido: Yup.string().required("El apellido es obligatorio"),
  email: Yup.string().email("Email inválido").required("El email es obligatorio"),
  rol: Yup.string().required("El rol es obligatorio"),
  usos: Yup.number().min(1, "Debe haber al menos 1 uso").max(100, "Máximo 100 usos").required("La cantidad de usos es obligatoria"),
  fechaExpiracion: Yup.string().nullable()
});

function CrearCodigo({ institucionId, institucionNombre, onCodigoCreado }) {
  const [form, setForm] = React.useState({
    nombre: "",
    apellido: "",
    rol: "profesor",
    usos: 1,
    fechaExpiracion: ""
  });
  const { error, clearError, setValidationError } = useErrorHandler();
  const { notify } = useNotification();
  const [cargando, setCargando] = React.useState(false);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
  clearError();
    setCargando(true);
    try {
      await codigoSchema.validate(form);
    } catch (validationError) {
      setValidationError(validationError.message);
      setCargando(false);
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const data = await ErrorHandler.handleFetch(
        "http://localhost:3000/api/auth/crear-codigo",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            rol: form.rol,
            nombre: form.nombre,
            apellido: form.apellido,
            usos: form.usos,
            fechaExpiracion: form.fechaExpiracion,
            institucion: institucionId,
            institucionNombre: institucionNombre
          })
        },
        "Error creando código"
      );
  notify(`Código creado: ${data.codigo}`);
      setForm({ nombre: "", apellido: "", rol: "profesor", usos: 1, fechaExpiracion: "" });
      if (onCodigoCreado) onCodigoCreado();
    } catch (errorObj) {
      setValidationError(errorObj.message || "Error inesperado al crear el código");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="crear-codigo-container">
      <h3>Crear nuevo código de invitación</h3>
      <form className="crear-codigo-form" onSubmit={handleSubmit}>
        <label>
          Nombre
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required />
        </label>
        <label>
          Apellido
          <input type="text" name="apellido" value={form.apellido} onChange={handleChange} required />
        </label>
        {/* Email destinatario eliminado, no requerido por el backend */}
        <label>
          Rol
          <select name="rol" value={form.rol} onChange={handleChange} required>
            <option value="profesor">Profesor</option>
            <option value="jefe_area">Jefe de Área</option>
            <option value="estudiante">Estudiante</option>
          </select>
        </label>
        <label>
          Usos
          <input type="number" name="usos" min="1" max="100" value={form.usos} onChange={handleChange} required />
        </label>
        <label>
          Fecha de expiración
          <input type="datetime-local" name="fechaExpiracion" value={form.fechaExpiracion} onChange={handleChange} />
        </label>
        <button type="submit" className="btn-crear-codigo" disabled={cargando}>
          {cargando ? "Creando..." : "Crear código"}
        </button>
      </form>
      <NotificationManager
        error={error}
        onClearError={clearError}
      />
    </div>
  );
}

export default CrearCodigo;
