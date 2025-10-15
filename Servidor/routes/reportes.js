const express = require('express');
const router = express.Router();
const Autoevaluacion = require('../models/Autoevaluacion');

// Reporte general por especialidad
router.get('/especialidad/:especialidad', async (req, res) => {
  try {
    const { especialidad } = req.params;
    const { fechaInicio, fechaFin, año } = req.query;

    let filtro = { especialidad };
    if (año) filtro.año = parseInt(año);
    if (fechaInicio && fechaFin) {
      filtro.fechaEvaluacion = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const reporte = await Autoevaluacion.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: {
            materia: '$materia',
            año: '$año'
          },
          totalAutoevaluaciones: { $sum: 1 },
          promedioComprension: { $avg: '$comprensionGeneral' },
          promedioDificultad: { $avg: '$dificultadPercibida' },
          promedioConfianza: { $avg: '$confianzaRespuestas' },
          promedioConocimientoPrevio: { $avg: '$conocimientoPrevio' }
        }
      },
      { $sort: { '_id.año': 1, '_id.materia': 1 } }
    ]);

    res.json({
      especialidad,
      reporte,
      fechaGeneracion: new Date(),
      filtrosAplicados: { año, fechaInicio, fechaFin }
    });

  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({
      error: 'Error al generar reporte por especialidad'
    });
  }
});

// Reporte comparativo entre materias
router.get('/comparativo', async (req, res) => {
  try {
    const { especialidad, año } = req.query;
    
    let filtro = {};
    if (especialidad) filtro.especialidad = especialidad;
    if (año) filtro.año = parseInt(año);

    const comparativo = await Autoevaluacion.aggregate([
      { $match: filtro },
      {
        $group: {
          _id: '$materia',
          totalRespuestas: { $sum: 1 },
          promedioComprension: { $avg: '$comprensionGeneral' },
          promedioDificultad: { $avg: '$dificultadPercibida' },
          promedioConfianza: { $avg: '$confianzaRespuestas' },
          promedioConocimientoPrevio: { $avg: '$conocimientoPrevio' },
          // Distribución de respuestas
          distribucionComprension: {
            $push: '$comprensionGeneral'
          }
        }
      },
      {
        $addFields: {
          // Calcular desviación estándar de comprensión
          variabilidadComprension: {
            $stdDevPop: '$distribucionComprension'
          }
        }
      },
      { $sort: { promedioDificultad: -1 } }
    ]);

    res.json({
      comparativo,
      fechaGeneracion: new Date(),
      filtrosAplicados: { especialidad, año }
    });

  } catch (error) {
    console.error('Error al generar comparativo:', error);
    res.status(500).json({
      error: 'Error al generar reporte comparativo'
    });
  }
});

// Reporte de evolución temporal
router.get('/evolucion/:materia', async (req, res) => {
  try {
    const { materia } = req.params;
    
    const evolucion = await Autoevaluacion.aggregate([
      { $match: { materia } },
      {
        $group: {
          _id: {
            año: { $year: '$fechaEvaluacion' },
            mes: { $month: '$fechaEvaluacion' },
            semana: { $week: '$fechaEvaluacion' }
          },
          promedioComprension: { $avg: '$comprensionGeneral' },
          promedioDificultad: { $avg: '$dificultadPercibida' },
          cantidadEvaluaciones: { $sum: 1 }
        }
      },
      { $sort: { '_id.año': 1, '_id.mes': 1, '_id.semana': 1 } }
    ]);

    res.json({
      materia,
      evolucion,
      fechaGeneracion: new Date()
    });

  } catch (error) {
    console.error('Error al generar evolución:', error);
    res.status(500).json({
      error: 'Error al generar reporte de evolución'
    });
  }
});

// Exportar datos para análisis externo (CSV/Excel)
router.get('/exportar', async (req, res) => {
  try {
    const { formato = 'json', especialidad, año, fechaInicio, fechaFin } = req.query;
    
    let filtro = {};
    if (especialidad) filtro.especialidad = especialidad;
    if (año) filtro.año = parseInt(año);
    if (fechaInicio && fechaFin) {
      filtro.fechaEvaluacion = {
        $gte: new Date(fechaInicio),
        $lte: new Date(fechaFin)
      };
    }

    const datos = await Autoevaluacion.find(filtro)
      .select('-estudianteAnonimo -__v') // Excluir datos sensibles
      .sort({ fechaEvaluacion: -1 });

    if (formato === 'csv') {
      // Convertir a CSV (implementación básica)
      const csv = convertirACSV(datos);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=reporte_ram.csv');
      return res.send(csv);
    }

    res.json({
      datos,
      total: datos.length,
      fechaExportacion: new Date(),
      filtrosAplicados: { especialidad, año, fechaInicio, fechaFin }
    });

  } catch (error) {
    console.error('Error al exportar datos:', error);
    res.status(500).json({
      error: 'Error al exportar datos'
    });
  }
});

// Función auxiliar para convertir a CSV
function convertirACSV(datos) {
  if (datos.length === 0) return '';
  
  const headers = Object.keys(datos[0].toObject());
  const csvHeaders = headers.join(',');
  
  const csvRows = datos.map(item => {
    const obj = item.toObject();
    return headers.map(header => {
      const value = obj[header];
      // Escapar comillas y envolver en comillas si contiene comas
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

module.exports = router;
