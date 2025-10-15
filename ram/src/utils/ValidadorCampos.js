// Ejemplo de uso:
// import ValidadorCampos from "../utils/ValidadorCampos";
// if (!ValidadorCampos.requerido(valor)) { ... }
// if (!ValidadorCampos.email(email)) { ... }
// if (!ValidadorCampos.passwordMatch(pass, confirm)) { ... }

// Puedes usarlo en el submit de tu formulario para validar cada campo y mostrar mensajes personalizados.
// utils/ValidadorCampos.js
// Validador de campos para formularios

const ValidadorCampos = {
  // Verifica que el valor no esté vacío (string, array o cualquier valor truthy)
  requerido: (valor) => {
    if (typeof valor === 'string') return valor.trim() !== '';
    if (Array.isArray(valor)) return valor.length > 0;
    return !!valor;
  },

  // Valida formato de email simple
  email: (valor) => {
    if (!valor) return false;
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor);
  },

  // Verifica longitud mínima de un string
  minLength: (valor, min) => {
    if (typeof valor !== 'string') return false;
    return valor.trim().length >= min;
  },

  // Verifica longitud máxima de un string
  maxLength: (valor, max) => {
    if (typeof valor !== 'string') return false;
    return valor.trim().length <= max;
  },

  // Valida que el DNI tenga 7 u 8 dígitos
  dni: (valor) => {
    return /^\d{7,8}$/.test(valor);
  },

  // Verifica que dos contraseñas coincidan
  passwordMatch: (pass, confirm) => {
    return pass === confirm;
  },

  // Puedes agregar más validaciones aquí
};

export default ValidadorCampos;
