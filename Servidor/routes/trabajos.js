const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Trabajo = require('../models/TrabajoPractico');
const Materia = require('../models/Materia');
const Usuario = require('../models/Usuario');
const trabajosHelper = require('../helpers/trabajosHelper');

// Crear nuevo trabajo práctico (profesor autenticado)
router.post('/', [
  body('titulo').notEmpty().trim(),
  body('materia').notEmpty().trim(),
  body('curso').isInt({ min: 1, max: 7 }),
  body('ciclo').notEmpty().isIn(['CBU','segundo']),
  body('division').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });

    // Validación de reglas de negocio por ciclo/curso/división/especialidad
  const business = trabajosHelper.validateTrabajoBusinessRules({ ciclo: req.body.ciclo, curso: req.body.curso, division: req.body.division, especialidad: req.body.especialidad });
    if (!business.ok) return res.status(business.status || 400).json({ error: business.message });

    // obtener profesor desde token (si existe) o desde body
    const profesorId = req.user && req.user._id ? req.user._id : req.body.profesor;
    if (!profesorId) return res.status(401).json({ error: 'No autorizado: falta profesor' });

    // Verificar autorización del profesor usando helper
    try {
  const autorizado = await trabajosHelper.checkProfesorAsignado(profesorId, { materiaId: req.body.materia, curso: req.body.curso, division: (business.normalized && business.normalized.division) || req.body.division, especialidad: (business.normalized && business.normalized.especialidad) || req.body.especialidad });
      if (!autorizado) return res.status(403).json({ error: 'No autorizado: el profesor no está asignado a la materia ni al curso/división indicado' });
    } catch (errUserCheck) {
      console.warn('Error verificando profesor:', errUserCheck);
      return res.status(500).json({ error: 'Error verificando permisos del profesor' });
    }

    // validar que la materia exista
    const materia = await Materia.findById(req.body.materia);
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });

    // Si la materia tiene campo division configurado, exigir division en el request
    const divisionRaw = (req.body.division || '').toString().trim().toUpperCase();
    if (materia.division && !divisionRaw && !(business.normalized && business.normalized.division)) {
      return res.status(400).json({ error: 'La materia requiere especificar division' });
    }

    const trabajo = new Trabajo({
      titulo: req.body.titulo,
      descripcion: req.body.descripcion || '',
      profesor: profesorId,
      materia: req.body.materia,
      materiaCodigo: materia.codigo,
      ciclo: req.body.ciclo,
  especialidad: (business.normalized && business.normalized.especialidad) || req.body.especialidad || materia.especialidad || '',
  curso: Number(req.body.curso),
  division: (business.normalized && business.normalized.division) || divisionRaw || (req.body.division || ''),
      temasAprendizaje: Array.isArray(req.body.temasAprendizaje) ? req.body.temasAprendizaje.map(String) : (req.body.temasAprendizaje ? String(req.body.temasAprendizaje).split(',').map(s=>s.trim()).filter(Boolean) : [])
    });

    await trabajo.save();

    res.status(201).json({ mensaje: 'Trabajo práctico creado', trabajo });
  } catch (err) {
    console.error('Error creando trabajo práctico', err);
    res.status(500).json({ error: 'Error interno al crear trabajo práctico' });
  }
});

// Editar trabajo (solo admin o profesor dueño)
router.put('/:id', [
  body('titulo').optional().trim(),
  body('descripcion').optional().trim(),
  body('curso').optional().isInt({ min: 1, max: 7 }),
  body('ciclo').optional().isIn(['CBU','segundo']),
  body('division').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });

    const trabajo = await Trabajo.findById(req.params.id);
    if (!trabajo) return res.status(404).json({ error: 'Trabajo no encontrado' });

    const editorId = req.user && req.user._id ? req.user._id : req.body.profesor;
    if (!editorId) return res.status(401).json({ error: 'No autorizado: falta usuario' });

    // permiso: admin o profesor dueño
    const usuario = await Usuario.findById(editorId).lean();
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (usuario.rol !== 'administrador' && String(trabajo.profesor) !== String(editorId)) {
      return res.status(403).json({ error: 'No autorizado para editar este trabajo' });
    }

    // Si envían division, validar según curso (nuevo o existente)
    // Aplicar reglas de negocio si se proveen datos relevantes
  const business = trabajosHelper.validateTrabajoBusinessRules({ ciclo: req.body.ciclo || trabajo.ciclo, curso: req.body.curso || trabajo.curso, division: req.body.division, especialidad: req.body.especialidad || trabajo.especialidad });
    if (!business.ok) return res.status(business.status || 400).json({ error: business.message });
    const nuevoCurso = req.body.curso ? Number(req.body.curso) : trabajo.curso;
    const divisionRaw = (business.normalized && business.normalized.division) || (req.body.division || '').toString().trim().toUpperCase();

    // aplicar cambios simples
    ['titulo','descripcion','ciclo','especialidad'].forEach(f => { if (req.body[f] !== undefined) trabajo[f] = req.body[f]; });
    if (req.body.curso) trabajo.curso = Number(req.body.curso);
  if (divisionRaw) trabajo.division = divisionRaw;
  if (business.normalized && business.normalized.especialidad) trabajo.especialidad = business.normalized.especialidad;
    if (req.body.temasAprendizaje) trabajo.temasAprendizaje = Array.isArray(req.body.temasAprendizaje) ? req.body.temasAprendizaje : String(req.body.temasAprendizaje).split(',').map(s=>s.trim()).filter(Boolean);

    await trabajo.save();
    res.json({ mensaje: 'Trabajo actualizado', trabajo });
  } catch (err) {
    console.error('Error editando trabajo', err);
    res.status(500).json({ error: 'Error al editar trabajo' });
  }
});

// Borrar (soft-delete) trabajo (solo admin o profesor dueño)
router.delete('/:id', async (req, res) => {
  try {
    const trabajo = await Trabajo.findById(req.params.id);
    if (!trabajo) return res.status(404).json({ error: 'Trabajo no encontrado' });

    const actorId = req.user && req.user._id ? req.user._id : req.body.profesor;
    if (!actorId) return res.status(401).json({ error: 'No autorizado: falta usuario' });

    const usuario = await Usuario.findById(actorId).lean();
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    if (usuario.rol !== 'administrador' && String(trabajo.profesor) !== String(actorId)) {
      return res.status(403).json({ error: 'No autorizado para eliminar este trabajo' });
    }

    trabajo.activo = false;
    await trabajo.save();
    res.json({ mensaje: 'Trabajo eliminado' });
  } catch (err) {
    console.error('Error eliminando trabajo', err);
    res.status(500).json({ error: 'Error al eliminar trabajo' });
  }
});

// Listar trabajos de un profesor (query ?profesor=xxx)
router.get('/', async (req, res) => {
  try {
    const { profesor, materia } = req.query;
    const filtro = { activo: true };
    if (profesor) filtro.profesor = profesor;
    if (materia) filtro.materia = materia;

    const trabajos = await Trabajo.find(filtro).populate('materia', 'nombre codigo especialidad ciclo').populate('profesor', 'nombre apellido email');
    res.json({ trabajos, cantidad: trabajos.length });
  } catch (err) {
    console.error('Error listando trabajos', err);
    res.status(500).json({ error: 'Error al listar trabajos' });
  }
});

// Obtener trabajos por materia
router.get('/materia/:id', async (req, res) => {
  try {
    const trabajos = await Trabajo.find({ materia: req.params.id, activo: true }).populate('profesor', 'nombre apellido');
    res.json({ trabajos });
  } catch (err) {
    console.error('Error al obtener trabajos por materia', err);
    res.status(500).json({ error: 'Error al obtener trabajos' });
  }
});

module.exports = router;
