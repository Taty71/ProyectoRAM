const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Autoevaluacion = require('../models/Autoevaluacion');

// Crear nueva autoevaluación (anónima)
router.post('/', [
  body('materia').notEmpty().trim().escape(),
  body('curso').notEmpty().trim().escape(),
  body('unidad').notEmpty().trim().escape(),
  body('comprensionGeneral').isInt({ min: 1, max: 5 }),
  body('conocimientoPrevio').isInt({ min: 1, max: 5 }),
  body('dificultadPercibida').isInt({ min: 1, max: 5 }),
  body('confianzaRespuestas').isInt({ min: 1, max: 5 }),
  body('fechaEvaluacion').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errors.array()
      });
    }

    // Generar ID anónimo único basado en timestamp y random
    const estudianteAnonimo = `EST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const autoevaluacion = new Autoevaluacion({
      ...req.body,
      estudianteAnonimo
    });

    await autoevaluacion.save();

    res.status(201).json({
      mensaje: 'Autoevaluación registrada exitosamente',
      id: autoevaluacion._id,
      fechaRegistro: autoevaluacion.fechaAutoevaluacion
    });

  } catch (error) {
    console.error('Error al crear autoevaluación:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      mensaje: 'No se pudo registrar la autoevaluación'
    });
  }
});

// Obtener estadísticas por materia
router.get('/estadisticas/materia/:materia', async (req, res) => {
  try {
    const { materia } = req.params;
    const { fechaInicio, fechaFin } = req.query;

    let filtro = { materia };
    
    if (fechaInicio && fechaFin) {
      filtro.fechaEvaluacion = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const estadisticas = await Autoevaluacion.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: '$materia',
          totalRespuestas: { $sum: 1 },
          promedioComprension: { $avg: '$comprensionGeneral' },
          promedioDificultad: { $avg: '$dificultadPercibida' },
          promedioConfianza: { $avg: '$confianzaRespuestas' },
          promedioConocimientoPrevio: { $avg: '$conocimientoPrevio' }
        }
      }
    ]);

    res.json({
      materia,
      estadisticas: estadisticas[0] || null,
      fechaConsulta: new Date()
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas'
    });
  }
});

// Obtener tendencias temporales
router.get('/tendencias/:materia', async (req, res) => {
  try {
    const { materia } = req.params;
    
    const tendencias = await Autoevaluacion.aggregate([
      { $match: { materia } },
      {
        $group: {
          _id: {
            año: { $year: '$fechaEvaluacion' },
            mes: { $month: '$fechaEvaluacion' }
          },
          promedioDificultad: { $avg: '$dificultadPercibida' },
          promedioComprension: { $avg: '$comprensionGeneral' },
          cantidadEvaluaciones: { $sum: 1 }
        }
      },
      { $sort: { '_id.año': 1, '_id.mes': 1 } }
    ]);

    res.json({
      materia,
      tendencias,
      fechaConsulta: new Date()
    });

  } catch (error) {
    console.error('Error al obtener tendencias:', error);
    res.status(500).json({
      error: 'Error al obtener tendencias'
    });
  }
});

module.exports = router;
