const express = require('express');
const router = express.Router();
const CodigoInvitacion = require('../models/CodigoInvitacion');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');
const { verificarUsuarioExistente } = require('../middleware/authMiddleware');
const SolicitudCodigo = require('../models/SolicitudCodigo');


const loginController = require('../controllers/loginController');
router.post('/login/usuario', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], loginController.loginUsuario);

router.post('/login/estudiante', [
  body('idEstudiante').notEmpty().trim(),
  body('password').isLength({ min: 6 })
], loginController.loginEstudiante);


const registroController = require('../controllers/registroController');
router.post('/registro/usuario', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('nombre').notEmpty().trim().escape(),
  body('apellido').notEmpty().trim().escape(),
  body('dni').notEmpty().trim(),
  body('rol').isIn(['administrador', 'profesor', 'jefe_area']),
  body('institucion').isMongoId(),
  body('codigoInvitacion').notEmpty().trim()
], registroController.registroUsuario);

router.post('/registro/estudiante', [
  body('idEstudiante').notEmpty().trim(),
  body('nombre').notEmpty().trim().escape(),
  body('apellido').notEmpty().trim().escape(),
  body('dni').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('institucion').isMongoId(),
  body('especialidad').notEmpty().trim(),
  body('año').isInt({ min: 1, max: 7 }),
  body('division').notEmpty().trim(),
  body('fechaNacimiento').isISO8601(),
  body('codigoInvitacion').notEmpty().trim()
], registroController.registroEstudiante);


const tokenController = require('../controllers/tokenController');
router.get('/verificar', tokenController.verificarToken);


const recuperarController = require('../controllers/recuperarController');
router.post('/recuperar', recuperarController.recuperarUsuario);
router.post('/recuperar/estudiante', recuperarController.recuperarEstudiante);


const codigoController = require('../controllers/codigoController');
router.post('/validar-codigo', [
  body('codigo').notEmpty().trim().withMessage('El código es requerido')
], codigoController.validarCodigo);
router.post('/crear-codigo', [
  body('rol').isIn(['profesor', 'jefe_area', 'estudiante']).withMessage('Rol inválido'),
  body('nombre').notEmpty().trim().withMessage('El nombre es requerido'),
  body('apellido').notEmpty().trim().withMessage('El apellido es requerido'),
  body('usos').isInt({ min: 1, max: 100 }).withMessage('Los usos deben ser entre 1 y 100'),
  body('fechaExpiracion').optional().isISO8601().withMessage('Fecha de expiración inválida')
], codigoController.crearCodigo);
router.get('/codigos-invitacion', codigoController.listarCodigos);
router.put('/desactivar-codigo/:id', codigoController.desactivarCodigo);

router.post('/verificar-usuario', verificarUsuarioExistente);

const { solicitarCodigo, listarSolicitudesCodigo } = require('../controllers/authController');
// Solicitar código de invitación (guarda y envía email al admin)
router.post('/solicitar-codigo', solicitarCodigo);
// Listar solicitudes de código para el dashboard admin
router.get('/solicitudes-codigo', listarSolicitudesCodigo);
// Eliminar solicitud de código
const { generarYEnviarCodigo } = require('../controllers/codigoController');
router.post('/generar-enviar-codigo', generarYEnviarCodigo);
const { eliminarSolicitudCodigo } = require('../controllers/authController');
router.delete('/solicitudes-codigo/:id', eliminarSolicitudCodigo);

module.exports = router;
