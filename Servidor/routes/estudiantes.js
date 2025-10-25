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

// Buscar estudiantes por query. Soportamos:
// - Búsqueda por dni: GET /api/estudiantes?dni=12345678
// - Listado por institución: GET /api/estudiantes?institucionId=...  OR /api/estudiantes?institucion=...
// Si se pasa `dni` se busca ese estudiante (opcionalmente filtrado por institución).
// Si no se pasa `dni` pero sí `institucionId`/`institucion`, se listan estudiantes de esa institución.
router.get('/', async (req, res) => {
  try {
    const { dni, institucionId, institucion } = req.query;
    const instId = institucionId || institucion;

    if (!dni && !instId) {
      return res.status(400).json({ error: 'Se requiere el parámetro dni o institucionId/institucion' });
    }

    const Estudiante = require('../models/Estudiante');

    const query = {};
    if (dni) query.dni = String(dni).trim();
    if (instId) query.institucion = instId;

    // Si se pasa dni devolver solo coincidencias (limitadas). Si se pasa sólo institución devolver un listado paginado básico.
    const limit = dni ? 20 : 200; // limitar por seguridad
    const estudiantes = await Estudiante.find(query).limit(limit).lean();

    return res.json({ estudiantes, total: estudiantes.length });
  } catch (error) {
    console.error('Error al buscar estudiantes:', error);
    return res.status(500).json({ error: 'Error al buscar estudiantes' });
  }
});

module.exports = router;
