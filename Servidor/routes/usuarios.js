const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const { verificarTokenUsuario, verificarRol } = require('../middleware/authMiddleware');

// Obtener usuarios de la institución
router.get('/', verificarTokenUsuario, verificarRol('administrador', 'jefe_area'), async (req, res) => {
  try {
    const { rol, activo = true } = req.query;
    
    let filtro = { institucion: req.usuario.institucion._id };
    if (rol) filtro.rol = rol;
    if (activo !== undefined) filtro.activo = activo === 'true';

    const usuarios = await Usuario.find(filtro)
      .select('-password')
      .populate('materias')
      .sort({ apellido: 1, nombre: 1 });

    res.json({
      usuarios,
      total: usuarios.length
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      error: 'Error al obtener usuarios'
    });
  }
});

// Obtener estudiantes de la institución
router.get('/estudiantes', verificarTokenUsuario, async (req, res) => {
  try {
    const { especialidad, año, estadoAcademico = 'activo', cicloAcademico } = req.query;
    
    let filtro = { institucion: req.usuario.institucion._id };
    if (especialidad) filtro.especialidad = especialidad;
    if (año) filtro.año = parseInt(año);
    if (estadoAcademico) filtro.estadoAcademico = estadoAcademico;
    if (cicloAcademico) filtro.cicloAcademico = parseInt(cicloAcademico);

    const estudiantes = await Estudiante.find(filtro)
      .select('-password')
      .sort({ especialidad: 1, año: 1, apellido: 1, nombre: 1 });

    res.json({
      estudiantes,
      total: estudiantes.length
    });

  } catch (error) {
    console.error('Error al obtener estudiantes:', error);
    res.status(500).json({
      error: 'Error al obtener estudiantes'
    });
  }
});

// Actualizar usuario
router.put('/:userId', verificarTokenUsuario, verificarRol('administrador'), [
  body('email').optional().isEmail().normalizeEmail(),
  body('nombre').optional().notEmpty().trim().escape(),
  body('apellido').optional().notEmpty().trim().escape(),
  body('rol').optional().isIn(['administrador', 'profesor', 'jefe_area']),
  body('activo').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errors.array()
      });
    }

    const { userId } = req.params;
    const updateData = req.body;

    // No permitir cambio de password aquí
    delete updateData.password;

    const usuario = await Usuario.findOneAndUpdate(
      { _id: userId, institucion: req.usuario.institucion._id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      mensaje: 'Usuario actualizado exitosamente',
      usuario
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      error: 'Error al actualizar usuario'
    });
  }
});

// Actualizar estudiante
router.put('/estudiantes/:estudianteId', verificarTokenUsuario, verificarRol('administrador', 'jefe_area'), [
  body('email').optional().isEmail().normalizeEmail(),
  body('nombre').optional().notEmpty().trim().escape(),
  body('apellido').optional().notEmpty().trim().escape(),
  body('especialidad').optional().notEmpty().trim(),
  body('año').optional().isInt({ min: 1, max: 7 }),
  body('estadoAcademico').optional().isIn(['activo', 'inactivo', 'graduado', 'transferido', 'abandonado'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errors.array()
      });
    }

    const { estudianteId } = req.params;
    const updateData = req.body;

    // No permitir cambio de password aquí
    delete updateData.password;

    const estudiante = await Estudiante.findOneAndUpdate(
      { _id: estudianteId, institucion: req.usuario.institucion._id },
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    if (!estudiante) {
      return res.status(404).json({
        error: 'Estudiante no encontrado'
      });
    }

    res.json({
      mensaje: 'Estudiante actualizado exitosamente',
      estudiante
    });

  } catch (error) {
    console.error('Error al actualizar estudiante:', error);
    res.status(500).json({
      error: 'Error al actualizar estudiante'
    });
  }
});

// Desactivar usuario
router.patch('/:userId/desactivar', verificarTokenUsuario, verificarRol('administrador'), async (req, res) => {
  try {
    const { userId } = req.params;

    const usuario = await Usuario.findOneAndUpdate(
      { _id: userId, institucion: req.usuario.institucion._id },
      { activo: false },
      { new: true }
    ).select('-password');

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json({
      mensaje: 'Usuario desactivado exitosamente',
      usuario
    });

  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    res.status(500).json({
      error: 'Error al desactivar usuario'
    });
  }
});

// Cambiar password (solo el propio usuario o administrador)
router.patch('/:userId/password', verificarTokenUsuario, [
  body('passwordActual').isLength({ min: 6 }),
  body('passwordNuevo').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errors.array()
      });
    }

    const { userId } = req.params;
    const { passwordActual, passwordNuevo } = req.body;

    // Verificar permisos: solo el propio usuario o administrador
    if (req.usuario._id.toString() !== userId && req.usuario.rol !== 'administrador') {
      return res.status(403).json({
        error: 'No tiene permisos para cambiar esta contraseña'
      });
    }

    const usuario = await Usuario.findOne({ 
      _id: userId, 
      institucion: req.usuario.institucion._id 
    });

    if (!usuario) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Verificar password actual (solo si no es administrador)
    if (req.usuario.rol !== 'administrador') {
      const passwordValido = await usuario.compararPassword(passwordActual);
      if (!passwordValido) {
        return res.status(401).json({
          error: 'Contraseña actual incorrecta'
        });
      }
    }

    // Actualizar password
    usuario.password = passwordNuevo;
    await usuario.save();

    res.json({
      mensaje: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      error: 'Error al cambiar contraseña'
    });
  }
});

module.exports = router;
