const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Institucion = require('../models/Institucion');

// Obtener ciclos y especialidades de una institución por ID
router.get('/:id/ciclos-especialidades', async (req, res) => {
  try {
    const institucion = await Institucion.findById(req.params.id);
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }
    res.json({ ciclos: institucion.ciclos });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ciclos y especialidades' });
  }
});
// Obtener institución activa
router.get('/activa', async (req, res) => {
  try {
    const institucion = await Institucion.findOne({ activa: true });
    
    if (!institucion) {
      return res.status(404).json({ 
        error: 'No hay institución activa configurada' 
      });
    }

    res.json({ institucion });
  } catch (error) {
    console.error('Error obteniendo institución activa:', error);
    res.status(500).json({ 
      error: 'Error al obtener institución activa' 
    });
  }
});
// Crear nueva institución
router.post('/', [
  body('nombre').notEmpty().trim().escape(),
  body('codigo').notEmpty().trim().escape(),
  body('direccion').isObject(),
  body('contacto').isObject(),
  body('tipoInstitucion').notEmpty().trim(),
  body('especialidades').isArray(),
  body('cicloAcademicoActual').isObject(),
  body('configuracion').isObject(),
  body('activa').isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }
    const nuevaInstitucion = new Institucion(req.body);
    await nuevaInstitucion.save();
    res.status(201).json({ mensaje: 'Institución registrada exitosamente', institucion: nuevaInstitucion });
  } catch (error) {
    console.error('Error al registrar institución:', error);
    if (error.code === 11000 && error.keyPattern && error.keyPattern.codigo) {
      res.status(409).json({ error: 'El código de institución ya existe. Debe ser único.' });
    } else {
      res.status(500).json({ error: 'Error al registrar institución' });
    }
  }
});

// Listar instituciones
router.get('/', async (req, res) => {
  try {
    const instituciones = await Institucion.find();
    res.json({ instituciones });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener instituciones' });
  }
});

// Obtener institución por ID
router.get('/:id', async (req, res) => {
  try {
    const institucion = await Institucion.findById(req.params.id);
    if (!institucion) {
      return res.status(404).json({ error: 'Institución no encontrada' });
    }
    res.json({ institucion });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener institución' });
  }
});

module.exports = router;
