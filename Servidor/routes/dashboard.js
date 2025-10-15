const express = require('express');
const router = express.Router();
const Autoevaluacion = require('../models/Autoevaluacion');

// Dashboard principal con métricas generales
router.get('/metricas', async (req, res) => {
  try {
    const { especialidad, año, fechaInicio, fechaFin } = req.query;
    
    let filtroBase = {};
    
    if (especialidad) filtroBase.especialidad = especialidad;
    if (año) filtroBase.año = parseInt(año);
    if (fechaInicio && fechaFin) {
      filtroBase.fechaEvaluacion = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    // Métricas generales
    const metricas = await Promise.all([
      // Total de autoevaluaciones
      Autoevaluacion.countDocuments(filtroBase),
      
      // Promedio general de comprensión
      Autoevaluacion.aggregate([
        { $match: filtroBase },
        {
          $group: {
            _id: null,
            promedioComprension: { $avg: '$comprensionGeneral' },
            promedioDificultad: { $avg: '$dificultadPercibida' },
            promedioConfianza: { $avg: '$confianzaRespuestas' },
            promedioConocimientoPrevio: { $avg: '$conocimientoPrevio' }
          }
        }
      ]),
      
      // Materias con mayor dificultad
      Autoevaluacion.aggregate([
        { $match: filtroBase },
        {
          $group: {
            _id: '$materia',
            promedioDificultad: { $avg: '$dificultadPercibida' },
            cantidadRespuestas: { $sum: 1 }
          }
        },
        { $sort: { promedioDificultad: -1 } },
        { $limit: 10 }
      ]),
      
      // Distribución por especialidad
      Autoevaluacion.aggregate([
        { $match: filtroBase },
        {
          $group: {
            _id: '$especialidad',
            cantidad: { $sum: 1 },
            promedioComprension: { $avg: '$comprensionGeneral' }
          }
        },
        { $sort: { cantidad: -1 } }
      ])
    ]);

    res.json({
      totalAutoevaluaciones: metricas[0],
      promediosGenerales: metricas[1][0] || {},
      materiasMasDificiles: metricas[2],
      distribucionEspecialidades: metricas[3],
      fechaConsulta: new Date()
    });

  } catch (error) {
    console.error('Error al obtener métricas:', error);
    res.status(500).json({
      error: 'Error al obtener métricas del dashboard'
    });
  }
});

// Análisis de patrones de aprendizaje
router.get('/patrones', async (req, res) => {
  try {
    const { materia } = req.query;
    
    let filtro = {};
    if (materia) filtro.materia = materia;

    // Análisis de estrategias de estudio más efectivas
    const patronesEstudio = await Autoevaluacion.aggregate([
      { $match: filtro },
      { $unwind: '$estrategiasEstudio' },
      {
        $group: {
          _id: '$estrategiasEstudio',
          promedioComprension: { $avg: '$comprensionGeneral' },
          promedioConfianza: { $avg: '$confianzaRespuestas' },
          cantidadUsos: { $sum: 1 }
        }
      },
      { $sort: { promedioComprension: -1 } }
    ]);

    // Correlación entre tiempo de estudio y comprensión
    const correlacionTiempo = await Autoevaluacion.aggregate([
      { $match: { ...filtro, tiempoEstudio: { $exists: true, $gt: 0 } } },
      {
        $bucket: {
          groupBy: '$tiempoEstudio',
          boundaries: [0, 2, 4, 6, 10, 50],
          default: 'mas_de_10h',
          output: {
            promedioComprension: { $avg: '$comprensionGeneral' },
            promedioDificultad: { $avg: '$dificultadPercibida' },
            cantidad: { $sum: 1 }
          }
        }
      }
    ]);

    res.json({
      estrategiasEfectivas: patronesEstudio,
      correlacionTiempoEstudio: correlacionTiempo,
      fechaAnalisis: new Date()
    });

  } catch (error) {
    console.error('Error al analizar patrones:', error);
    res.status(500).json({
      error: 'Error al analizar patrones de aprendizaje'
    });
  }
});

// Alertas y recomendaciones
router.get('/alertas', async (req, res) => {
  try {
    const alertas = [];
    
    // Materias con alta dificultad percibida (promedio > 4)
    const materiasAltaDificultad = await Autoevaluacion.aggregate([
      {
        $group: {
          _id: '$materia',
          promedioDificultad: { $avg: '$dificultadPercibida' },
          cantidadRespuestas: { $sum: 1 }
        }
      },
      { $match: { promedioDificultad: { $gte: 4 }, cantidadRespuestas: { $gte: 5 } } },
      { $sort: { promedioDificultad: -1 } }
    ]);

    if (materiasAltaDificultad.length > 0) {
      alertas.push({
        tipo: 'alta_dificultad',
        prioridad: 'alta',
        mensaje: 'Materias con alta dificultad percibida detectadas',
        materias: materiasAltaDificultad,
        recomendacion: 'Revisar estrategias didácticas y brindar apoyo adicional'
      });
    }

    // Materias con baja comprensión general (promedio < 3)
    const materiasBajaComprension = await Autoevaluacion.aggregate([
      {
        $group: {
          _id: '$materia',
          promedioComprension: { $avg: '$comprensionGeneral' },
          cantidadRespuestas: { $sum: 1 }
        }
      },
      { $match: { promedioComprension: { $lte: 3 }, cantidadRespuestas: { $gte: 5 } } },
      { $sort: { promedioComprension: 1 } }
    ]);

    if (materiasBajaComprension.length > 0) {
      alertas.push({
        tipo: 'baja_comprension',
        prioridad: 'alta',
        mensaje: 'Materias con baja comprensión general detectadas',
        materias: materiasBajaComprension,
        recomendacion: 'Implementar actividades de refuerzo y seguimiento individualizado'
      });
    }

    res.json({
      alertas,
      cantidadAlertas: alertas.length,
      fechaGeneracion: new Date()
    });

  } catch (error) {
    console.error('Error al generar alertas:', error);
    res.status(500).json({
      error: 'Error al generar alertas'
    });
  }
});

module.exports = router;
