const express = require('express');
const { verificarToken } = require('../middleware/authMiddleware');
const router = express.Router();
const Estudiante = require('../models/Estudiante');
const Materia = require('../models/Materia');
const Usuario = require('../models/Usuario');


// Obtener estructura de la escuela (CBU + Especialidades)
router.get('/estructura', verificarToken, async (req, res) => {
  try {
    const institucionId = req.usuario?.institucion?._id || req.estudiante?.institucion?._id;

    // Contar estudiantes por especialidad y año
    const distribucionEstudiantes = await Estudiante.aggregate([
      { 
        $match: { 
          institucion: institucionId,
          estadoAcademico: 'activo',
          cicloAcademico: new Date().getFullYear()
        } 
      },
      {
        $group: {
          _id: { especialidad: '$especialidad', año: '$año' },
          cantidad: { $sum: 1 },
          estudiantes: { 
            $push: {
              idEstudiante: '$idEstudiante',
              nombre: '$nombre',
              apellido: '$apellido'
            }
          }
        }
      },
      { $sort: { '_id.especialidad': 1, '_id.año': 1 } }
    ]);

    // Contar materias por especialidad y año
    const materiasPorEspecialidad = await Materia.aggregate([
      {
        $match: {
          institucion: institucionId,
          activa: true,
          cicloAcademico: new Date().getFullYear()
        }
      },
      {
        $lookup: {
          from: 'usuarios',
          localField: 'profesor',
          foreignField: '_id',
          as: 'profesor'
        }
      },
      {
        $unwind: '$profesor'
      },
      {
        $group: {
          _id: { especialidad: '$especialidad', año: '$año' },
          materias: {
            $push: {
              nombre: '$nombre',
              codigo: '$codigo',
              profesor: {
                nombre: '$profesor.nombre',
                apellido: '$profesor.apellido',
                email: '$profesor.email'
              }
            }
          }
        }
      },
      { $sort: { '_id.especialidad': 1, '_id.año': 1 } }
    ]);

    // Organizar la estructura
    const estructura = {
      cbu: {
        nombre: 'Ciclo Básico Unificado',
        años: [1, 2, 3],
        descripcion: 'Formación básica común para todos los estudiantes',
        estudiantes: {},
        materias: {}
      },
      especialidades: {
        electricidad: {
          nombre: 'Técnico en Electricidad',
          años: [4, 5, 6],
          descripcion: 'Formación técnica en sistemas eléctricos y electrónicos',
          estudiantes: {},
          materias: {}
        },
        programacion: {
          nombre: 'Técnico en Programación',
          años: [4, 5, 6],
          descripcion: 'Formación técnica en desarrollo de software',
          estudiantes: {},
          materias: {}
        }
      }
    };

    // Asignar estudiantes a la estructura
    distribucionEstudiantes.forEach(item => {
      const { especialidad, año } = item._id;
      const { cantidad, estudiantes } = item;

      if (especialidad === 'CBU') {
        estructura.cbu.estudiantes[año] = { cantidad, estudiantes };
      } else if (especialidad === 'Electricidad') {
        estructura.especialidades.electricidad.estudiantes[año] = { cantidad, estudiantes };
      } else if (especialidad === 'Programación') {
        estructura.especialidades.programacion.estudiantes[año] = { cantidad, estudiantes };
      }
    });

    // Asignar materias a la estructura
    materiasPorEspecialidad.forEach(item => {
      const { especialidad, año } = item._id;
      const { materias } = item;

      if (especialidad === 'CBU') {
        estructura.cbu.materias[año] = materias;
      } else if (especialidad === 'Electricidad') {
        estructura.especialidades.electricidad.materias[año] = materias;
      } else if (especialidad === 'Programación') {
        estructura.especialidades.programacion.materias[año] = materias;
      }
    });

    // Calcular totales
    const totales = {
      cbu: 0,
      electricidad: 0,
      programacion: 0
    };

    Object.values(estructura.cbu.estudiantes).forEach(año => {
      totales.cbu += año.cantidad;
    });

    Object.values(estructura.especialidades.electricidad.estudiantes).forEach(año => {
      totales.electricidad += año.cantidad;
    });

    Object.values(estructura.especialidades.programacion.estudiantes).forEach(año => {
      totales.programacion += año.cantidad;
    });

    res.json({
      estructura,
      totales,
      totalGeneral: totales.cbu + totales.electricidad + totales.programacion,
      cicloAcademico: new Date().getFullYear()
    });

  } catch (error) {
    console.error('Error al obtener estructura:', error);
    res.status(500).json({
      error: 'Error al obtener estructura de la escuela'
    });
  }
});

// Obtener información específica de un año
router.get('/año/:año', verificarToken, async (req, res) => {
  try {
    const { año } = req.params;
    const añoNum = parseInt(año);
    const institucionId = req.usuario?.institucion?._id || req.estudiante?.institucion?._id;

    if (añoNum < 1 || añoNum > 6) {
      return res.status(400).json({
        error: 'Año debe estar entre 1 y 6'
      });
    }

    let especialidad;
    if (añoNum <= 3) {
      especialidad = 'CBU';
    } else {
      // Para años 4-6, obtener ambas especialidades
      const [electricidadData, programacionData, materiasElectricidad, materiasProgramacion] = await Promise.all([
        Estudiante.find({
          institucion: institucionId,
          año: añoNum,
          especialidad: 'Electricidad',
          estadoAcademico: 'activo'
  }).select('idEstudiante nombre apellido division'),

        Estudiante.find({
          institucion: institucionId,
          año: añoNum,
          especialidad: 'Programación',
          estadoAcademico: 'activo'
  }).select('idEstudiante nombre apellido division'),

        Materia.find({
          institucion: institucionId,
          año: añoNum,
          especialidad: 'Electricidad',
          activa: true
        }).populate('profesor', 'nombre apellido email'),

        Materia.find({
          institucion: institucionId,
          año: añoNum,
          especialidad: 'Programación',
          activa: true
        }).populate('profesor', 'nombre apellido email')
      ]);

      return res.json({
        año: añoNum,
        especialidades: {
          electricidad: {
            estudiantes: electricidadData,
            materias: materiasElectricidad,
            total: electricidadData.length
          },
          programacion: {
            estudiantes: programacionData,
            materias: materiasProgramacion,
            total: programacionData.length
          }
        }
      });
    }

    // Para CBU (años 1-3)
    const [estudiantes, materias] = await Promise.all([
      Estudiante.find({
        institucion: institucionId,
        año: añoNum,
        especialidad: 'CBU',
        estadoAcademico: 'activo'
  }).select('idEstudiante nombre apellido division'),

      Materia.find({
        institucion: institucionId,
        año: añoNum,
        especialidad: 'CBU',
        activa: true
      }).populate('profesor', 'nombre apellido email')
    ]);

    res.json({
      año: añoNum,
      especialidad: 'CBU',
      estudiantes,
      materias,
      total: estudiantes.length
    });

  } catch (error) {
    console.error('Error al obtener información del año:', error);
    res.status(500).json({
      error: 'Error al obtener información del año'
    });
  }
});

module.exports = router;
