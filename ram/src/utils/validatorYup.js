// Esquema para login
export const loginSchema = Yup.object().shape({
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
  password: Yup.string().required('La contraseña es obligatoria'),
});

// Esquema para recuperación de contraseña
export const recuperoSchema = Yup.object().shape({
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
});
// utils/validatorYup.js
import * as Yup from 'yup';

// Esquema para institución
export const institucionSchema = Yup.object().shape({
  nombre: Yup.string().required('El nombre de la institución es obligatorio'),
  codigo: Yup.string().required('El código es obligatorio'),
  modalidad: Yup.string().oneOf(['tecnica', 'orientada']).required('La modalidad es obligatoria'),
  ciclos: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string().required('El identificador de la especialidad/orientación es obligatorio'),
        nombre: Yup.string().required('El nombre del ciclo es obligatorio'),
        cursos: Yup.array()
          .of(Yup.string().required('El nombre del curso es obligatorio'))
          .min(1, 'Debe agregar al menos un curso')
          .required('Debe agregar los cursos')
      })
    )
    .min(1, 'Debe agregar al menos un ciclo'),
  contacto: Yup.object().shape({
    email: Yup.string().email('Email inválido').required('El email de la institución es obligatorio'),
    sitioWeb: Yup.string().url('El sitio web debe ser una URL válida').nullable()
  })
});

// Esquema para administrador
export const administradorSchema = Yup.object().shape({
  nombre: Yup.string().required('El nombre es obligatorio'),
  apellido: Yup.string().required('El apellido es obligatorio'),
  email: Yup.string().email('Email inválido').required('El email es obligatorio'),
  dni: Yup.string().matches(/^\\d{7,8}$/, 'DNI inválido').required('El DNI es obligatorio'),
  password: Yup.string().min(6, 'La contraseña debe tener al menos 6 caracteres').required('La contraseña es obligatoria'),
  confirmarPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Las contraseñas no coinciden')
    .required('Debes confirmar la contraseña'),
  rol: Yup.string().required('Debes seleccionar el rol'),
});
