const express = require('express');
const router = express.Router();

// Ruta básica para estudiantes anónimos
router.get('/anonimo/info', (req, res) => {
  res.json({
    mensaje: 'Endpoint para información de estudiantes anónimos',
    descripcion: 'Los estudiantes acceden de forma anónima para realizar autoevaluaciones',
    funcionalidades: [
      'No requiere registro personal',
      'Identificación temporal durante la sesión',
      'Privacidad total garantizada'
    ]
  });
});

// Estadísticas generales de participación (sin datos personales)
router.get('/participacion', async (req, res) => {
  try {
    const Autoevaluacion = require('../models/Autoevaluacion');
    
    const estadisticasParticipacion = await Autoevaluacion.aggregate([
      {
        $group: {
          _id: {
            especialidad: '$especialidad',
            año: '$año'
          },
          totalParticipaciones: { $sum: 1 },
          ultimaParticipacion: { $max: '$fechaAutoevaluacion' }
        }
      },
      { $sort: { '_id.especialidad': 1, '_id.año': 1 } }
    ]);

    res.json({
      participacion: estadisticasParticipacion,
      fechaConsulta: new Date()
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de participación:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas'
    });
  }
});

module.exports = router;
