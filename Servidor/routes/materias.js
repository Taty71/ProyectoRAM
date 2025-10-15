const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Materia = require('../models/Materia');

// Obtener todas las materias activas
router.get('/', async (req, res) => {
  try {
    const { especialidad, año } = req.query;
    
    let filtro = { activa: true };
    if (especialidad) filtro.especialidad = especialidad;
    if (año) filtro.año = parseInt(año);

    const materias = await Materia.find(filtro).sort({ especialidad: 1, año: 1, nombre: 1 });

    res.json({
      materias,
      cantidad: materias.length
    });

  } catch (error) {
    console.error('Error al obtener materias:', error);
    res.status(500).json({
      error: 'Error al obtener materias'
    });
  }
});

// Crear nueva materia
router.post('/', [
  body('nombre').notEmpty().trim().escape(),
  body('codigo').notEmpty().trim().escape(),
  body('institucion').notEmpty().trim(),
  body('ciclo').notEmpty().trim(),
  body('especialidad').optional().trim(),
  body('año').isInt({ min: 1, max: 7 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errors.array()
      });
    }

    // Validar ciclo y especialidad según la institución
    const { institucion, ciclo, especialidad } = req.body;
    const Institucion = require('../models/Institucion');
    const inst = await Institucion.findById(institucion);
    if (!inst) return res.status(404).json({ error: 'Institución no encontrada' });

    // Validar ciclo
    const cicloValido = inst.ciclos && inst.ciclos.some(c => c.codigo === ciclo);
    if (!cicloValido) return res.status(400).json({ error: 'Ciclo no válido para la institución' });

    // Validar especialidad si corresponde
    if (ciclo === 'segundo') {
      const cicloObj = inst.ciclos.find(c => c.codigo === ciclo);
      const especialidadValida = cicloObj.especialidades.some(e => e.codigo === especialidad);
      if (!especialidadValida) return res.status(400).json({ error: 'Especialidad no válida para la institución y ciclo' });
    }

    const materia = new Materia(req.body);
    await materia.save();

    res.status(201).json({
      mensaje: 'Materia creada exitosamente',
      materia
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        error: 'La materia ya existe (nombre o código duplicado)'
      });
    }
    
    console.error('Error al crear materia:', error);
    res.status(500).json({
      error: 'Error al crear materia'
    });
  }
});

// Obtener especialidades disponibles
router.get('/especialidades', async (req, res) => {
  try {
    const especialidades = await Materia.distinct('especialidad', { activa: true });

    res.json({
      especialidades: especialidades.sort()
    });

  } catch (error) {
    console.error('Error al obtener especialidades:', error);
    res.status(500).json({
      error: 'Error al obtener especialidades'
    });
  }
});

// Obtener materia específica con sus unidades
router.get('/:id', async (req, res) => {
  try {
    const materia = await Materia.findById(req.params.id);
    
    if (!materia) {
      return res.status(404).json({
        error: 'Materia no encontrada'
      });
    }

    res.json(materia);

  } catch (error) {
    console.error('Error al obtener materia:', error);
    res.status(500).json({
      error: 'Error al obtener materia'
    });
  }
});

module.exports = router;
