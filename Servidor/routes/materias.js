const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Materia = require('../models/Materia');

// Obtener todas las materias activas
router.get('/', async (req, res) => {
  try {
    const { especialidad, año, institucionId, profesor } = req.query;
    
    let filtro = { activa: true };
    if (especialidad) filtro.especialidad = especialidad;
    if (año) filtro.año = parseInt(año);
    if (institucionId) filtro.institucion = institucionId;
    if (profesor) filtro.profesor = profesor;

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

const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// Crear nueva materia
// Require authenticated user (admin typically) to create a materia
router.post('/', verificarToken, [
  body('nombre').notEmpty().trim().escape(),
  body('codigo').notEmpty().trim().escape(),
  // allow institucion to be optional here - we'll try to infer it from the authenticated user
  body('institucion').optional().trim(),
  body('ciclo').notEmpty().trim(),
  body('especialidad').optional().trim(),
  body('division').optional().trim().isLength({ min: 1, max: 2 }),
  body('cargaHoraria').optional(),
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

    // Normalize ciclo values (accept case-insensitive 'segundo' or 'Segundo')
    if (req.body.ciclo) {
      const cVal = String(req.body.ciclo).toLowerCase();
      if (cVal === 'cbu') req.body.ciclo = 'CBU';
      else if (cVal === 'segundo') req.body.ciclo = 'Segundo';
    }

    // Resolve or infer institucion: prefer explicit, then authenticated user's institucion, then fallback to single-institucion DB
    let { institucion } = req.body;
    // Normalize ciclo from request body if present (PUT handler will also accept case-insensitive values)
    if (req.body.ciclo) {
      const cVal = String(req.body.ciclo).toLowerCase();
      if (cVal === 'cbu') req.body.ciclo = 'CBU';
      else if (cVal === 'segundo') req.body.ciclo = 'Segundo';
    }
    const { ciclo, especialidad } = req.body;
    const Institucion = require('../models/Institucion');
    let inst = null;
    if (!institucion && req.usuario && req.usuario.institucion) {
      institucion = req.usuario.institucion;
      console.debug('POST /api/materias - infer institucion from req.usuario:', institucion);
    }
    if (!institucion) {
      // if there is exactly one institution in the DB, use it as the default for setup scenarios
      const count = await Institucion.countDocuments();
      if (count === 1) {
        inst = await Institucion.findOne();
        institucion = inst._id;
        console.debug('POST /api/materias - single Institucion in DB, using', institucion);
      }
    }
    if (institucion) inst = inst || await Institucion.findById(institucion);
    if (!inst) return res.status(404).json({ error: 'Institución no encontrada; proporcione institucion en el cuerpo o configure una institución en el sistema' });

    // Validación de ciclos/ especialidades:
    // - 'CBU' representa primer ciclo (aceptado sin especialidad)
    // - 'segundo' representa segundo ciclo y debe mapear a una especialidad definida en inst.ciclos
    if (ciclo === 'CBU') {
      // primer ciclo: ok
      // validar año para CBU: 1-3
      if (typeof req.body.año === 'undefined' || req.body.año < 1 || req.body.año > 3) {
        return res.status(400).json({ error: 'Año inválido para CBU (debe ser 1 a 3)' });
      }
    } else if (ciclo === 'segundo' || ciclo === 'Segundo') {
      if (!Array.isArray(inst.ciclos) || inst.ciclos.length === 0) {
        return res.status(400).json({ error: 'La institución no define ciclos para segundo ciclo' });
      }
      // Buscar la especialidad entre inst.ciclos (coincidir por id o nombre)
      const especialidadValida = inst.ciclos.some(c => {
        if (!c) return false;
        const target = String(especialidad || '').toLowerCase().trim();
        const candidates = [];
        if (typeof c === 'string') candidates.push(String(c).toLowerCase().trim());
        if (c.id) candidates.push(String(c.id).toLowerCase().trim());
        if (c.nombre) candidates.push(String(c.nombre).toLowerCase().trim());
        return candidates.includes(target);
      });
      if (!especialidadValida) return res.status(400).json({ error: 'Especialidad no válida para la institución y ciclo' });
      // validar año para segundo: 4-7
      if (typeof req.body.año === 'undefined' || req.body.año < 4 || req.body.año > 7) {
        return res.status(400).json({ error: 'Año inválido para Segundo Ciclo (debe ser 4 a 7)' });
      }
    } else {
      return res.status(400).json({ error: 'Ciclo no válido' });
    }

    // Validar división basada en el año
    const division = req.body.division;
    if (typeof division !== 'undefined' && division !== null) {
      const año = Number(req.body.año);
      const allowed = (año >=1 && año <=3) ? ['A','B','C'] : (año >=4 && año <=7) ? ['A','B'] : [];
      if (!allowed.includes(String(division))) {
        return res.status(400).json({ error: `División inválida para el año ${año}` });
      }
    }

    // Si profesor viene como cadena vacía, eliminar para evitar cast error a ObjectId
  if (typeof req.body.profesor === 'string' && req.body.profesor.trim() === '') delete req.body.profesor;

    // Permisos: sólo admins pueden crear materias para otras instituciones o asignar profesor diferente.
    // Aquí permitimos que usuarios autenticados creen materias, pero si no son admin se aplican restricciones:
    // - la institucion en el body debe coincidir con la del usuario
    // - si se indica profesor, sólo puede asignarse al propio usuario
    if (req.usuario) {
      // Normalizar rol y aceptar variantes ('admin', 'administrador', 'superadmin'...)
      const rolActual = String(req.usuario.rol || '').toLowerCase();
      const isAdmin = ['admin', 'administrador', 'superadmin', 'super-admin'].includes(rolActual);
      if (!isAdmin) {
        // enforce institution match
        if (req.body.institucion && String(req.body.institucion) !== String(req.usuario.institucion?._id || req.usuario.institucion)) {
          return res.status(403).json({ error: 'No autorizado para crear materias en esa institución' });
        }
        // if profesor provided, only allow assigning to self
        if (req.body.profesor && String(req.body.profesor) !== String(req.usuario._id)) {
          return res.status(403).json({ error: 'No autorizado para asignar profesor distinto' });
        }
      }
    }
  const materiaData = { ...req.body };
  // Si viene cargaHoraria como objeto, permitir guardar su campo horario
  if (materiaData.cargaHoraria && typeof materiaData.cargaHoraria === 'object') {
    materiaData.cargaHoraria = {
      horasSemanales: materiaData.cargaHoraria.horasSemanales,
      horasTotales: materiaData.cargaHoraria.horasTotales,
      horario: materiaData.cargaHoraria.horario
    };
  }
  if (materiaData.division) materiaData.division = String(materiaData.division);
  const materia = new Materia(materiaData);
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

// Actualizar materia
// Update materia: require token; then enforce role rules in handler
router.put('/:id', verificarToken, [
  body('nombre').optional().trim().escape(),
  body('codigo').optional().trim().escape(),
  body('ciclo').optional().trim(),
  body('especialidad').optional().trim(),
  body('division').optional().trim().isLength({ min: 1, max: 2 }),
  body('año').optional().isInt({ min: 1, max: 7 })
], async (req, res) => {
  try {
    console.log(`PUT /api/materias/${req.params.id} payload:`, { body: req.body });
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }

    // Normalize ciclo values in PUT body (accept case-insensitive 'segundo' or 'CBU')
    if (req.body.ciclo) {
      const cVal = String(req.body.ciclo).toLowerCase();
      if (cVal === 'cbu') req.body.ciclo = 'CBU';
      else if (cVal === 'segundo') req.body.ciclo = 'Segundo';
    }

    // Normalize cargaHoraria shape if frontend sent alternative keys (e.g. { carga, horarios })
    if (req.body.cargaHoraria && typeof req.body.cargaHoraria === 'object') {
      const ch = req.body.cargaHoraria;
      const normalized = {};
      if (typeof ch.carga !== 'undefined') normalized.horasSemanales = Number(ch.carga);
      if (typeof ch.horasSemanales !== 'undefined') normalized.horasSemanales = Number(ch.horasSemanales);
      if (typeof ch.horasTotales !== 'undefined') normalized.horasTotales = Number(ch.horasTotales);
      if (ch.horarios && typeof ch.horarios === 'object') {
        // build a readable horario string from an object of {dia: horario}
        const parts = [];
        Object.keys(ch.horarios).forEach(k => {
          const v = ch.horarios[k];
          if (v) parts.push(`${k}: ${v}`);
        });
        if (parts.length) normalized.horario = parts.join(' | ');
      } else if (ch.horario) {
        normalized.horario = ch.horario;
      }
      if (Array.isArray(ch.dias)) normalized.dias = ch.dias;
      // Replace body.cargaHoraria with normalized shape
      req.body.cargaHoraria = normalized;
    }

  // Si profesor viene como cadena vacía, eliminar para evitar cast error a ObjectId
  if (typeof req.body.profesor === 'string' && req.body.profesor.trim() === '') delete req.body.profesor;

    // Intentar buscar por id; si no existe, intentar un fallback por código+institución
    let materia = await Materia.findById(req.params.id);
    if (!materia) {
      console.warn(`PUT /api/materias/:id - materia con id ${req.params.id} no encontrada, intentando fallback por código. body.codigo=${req.body.codigo}, body.institucion=${req.body.institucion}`);
      if (req.body.codigo && (req.body.institucion || req.body.institucion === undefined)) {
        const query = { codigo: req.body.codigo };
        if (req.body.institucion) query.institucion = req.body.institucion;
        materia = await Materia.findOne(query);
        console.log('Fallback query result materia:', materia ? materia._id : null);
      }
      if (!materia) {
        console.log(`PUT /api/materias/:id -> returning 404 Materia no encontrada for id ${req.params.id}`);
        return res.status(404).json({ error: 'Materia no encontrada' });
      }
    }

  // Determinar institución a validar (puede venir en body o usar la existente)
    const Institucion = require('../models/Institucion');
    const institucionId = req.body.institucion || materia.institucion;
    const inst = await Institucion.findById(institucionId);
    if (!inst) {
      console.warn(`PUT /api/materias/:id - Institucion ${institucionId} no encontrada; saltando validaciones basadas en institucion.`);
    }

    const { ciclo, especialidad } = req.body;
    if (ciclo) {
      if (ciclo === 'CBU') {
        // validar año para CBU: 1-3
        if (typeof req.body.año !== 'undefined' && (req.body.año < 1 || req.body.año > 3)) {
          return res.status(400).json({ error: 'Año inválido para CBU (debe ser 1 a 3)' });
        }
  } else if (ciclo === 'segundo' || ciclo === 'Segundo') {
        // Solo validar especialidades si tenemos la institución y sus ciclos definidos.
        if (!inst || !Array.isArray(inst.ciclos) || inst.ciclos.length === 0) {
          console.warn('PUT /api/materias/:id - no hay información de ciclos en la institución; omitiendo validación de especialidad');
        } else {
          const target = String(especialidad || materia.especialidad || '').toLowerCase().trim();
          const especialidadValida = inst.ciclos.some(c => {
            if (!c) return false;
            const candidates = [];
            if (typeof c === 'string') candidates.push(String(c).toLowerCase().trim());
            if (c.id) candidates.push(String(c.id).toLowerCase().trim());
            if (c.nombre) candidates.push(String(c.nombre).toLowerCase().trim());
            return candidates.includes(target);
          });
          if (!especialidadValida) return res.status(400).json({ error: 'Especialidad no válida para la institución y ciclo' });
        }
        if (typeof req.body.año !== 'undefined' && (req.body.año < 4 || req.body.año > 7)) {
          return res.status(400).json({ error: 'Año inválido para Segundo Ciclo (debe ser 4 a 7)' });
        }
      } else {
        return res.status(400).json({ error: 'Ciclo no válido' });
      }
    }

    // Validar división si viene
    if (typeof req.body.division !== 'undefined') {
      const añoVal = typeof req.body.año !== 'undefined' ? Number(req.body.año) : materia.año;
      const allowed = (añoVal >=1 && añoVal <=3) ? ['A','B','C'] : (añoVal >=4 && añoVal <=7) ? ['A','B'] : [];
      if (!allowed.includes(String(req.body.division))) {
        return res.status(400).json({ error: `División inválida para el año ${añoVal}` });
      }
    }

      // Permisos: admins pueden actualizar cualquier campo. Profesores tienen permisos limitados.
      const caller = req.usuario; // set by verificarToken
      if (!caller) {
        return res.status(401).json({ error: 'Se requiere autenticación para actualizar materias' });
      }

  const rolActual = String(caller.rol || '').toLowerCase();
  const isAdmin = ['admin', 'administrador', 'superadmin', 'super-admin'].includes(rolActual);

      // If non-admin tries to change `profesor` to another id -> reject
      if (!isAdmin && typeof req.body.profesor !== 'undefined' && String(req.body.profesor) !== String(caller._id)) {
        return res.status(403).json({ error: 'No autorizado para asignar otro profesor' });
      }

      // If non-admin tries to modify fields beyond allowed set, restrict
      const camposAdmin = ['nombre', 'codigo', 'ciclo', 'especialidad', 'año', 'profesor', 'division', 'cargaHoraria'];
      const camposProfesorAllowed = ['cargaHoraria'];

      if (isAdmin) {
        camposAdmin.forEach(f => { if (typeof req.body[f] !== 'undefined') materia[f] = req.body[f]; });
      } else {
        // Profesor: only allow updating cargaHoraria (horario) for materias they own, or allow self-assign if allowed.
        // If attempting to set profesor to self (self-assign), allow it when materia.profesor is empty or different.
        if (typeof req.body.profesor !== 'undefined' && String(req.body.profesor) === String(caller._id)) {
          materia.profesor = caller._id;
        }

        // Only allow updating cargaHoraria if the caller is the assigned professor
        const isAssignedProfessor = materia.profesor && String(materia.profesor) === String(caller._id);
        if (typeof req.body.cargaHoraria !== 'undefined') {
          if (!isAssignedProfessor) return res.status(403).json({ error: 'Sólo el profesor asignado puede editar la carga horaria' });
          materia.cargaHoraria = req.body.cargaHoraria;
        }
      }

    // Si después de aplicar el body la materia no tiene 'ciclo' (campo requerido por el esquema),
    // intentar inferirlo desde la especialidad (body o existente) o establecer 'CBU' por defecto.
    if (!materia.ciclo) {
      const espec = req.body.especialidad || materia.especialidad;
      if (espec === 'CBU') materia.ciclo = 'CBU';
  else if (espec && String(espec).trim() !== '') materia.ciclo = 'Segundo';
      else materia.ciclo = 'CBU';
      console.warn(`PUT /api/materias/:id - ciclo faltante inferido como '${materia.ciclo}' para materia ${materia._id}`);
    }

    await materia.save();
    res.json({ mensaje: 'Materia actualizada', materia });
  } catch (error) {
    console.error('Error al actualizar materia:', error);
    res.status(500).json({ error: 'Error al actualizar materia', mensaje: error && error.message ? String(error.message) : undefined });
  }
});

// Borrar (soft-delete) materia
router.delete('/:id', async (req, res) => {
  try {
    console.log(`DELETE handler (atomic) invoked for id=${req.params.id} from ${req.ip || req.connection && req.connection.remoteAddress}`);
    // Use an atomic update to avoid triggering full document validation which
    // could fail if there are legacy/invalid fields (e.g. profesor = "").
    const materia = await Materia.findByIdAndUpdate(req.params.id, { $set: { activa: false } }, { new: true, runValidators: false });
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });
    return res.json({ mensaje: 'Materia eliminada', materia });
  } catch (error) {
    console.error('Error al borrar materia:', error);
    // Return error message to help frontend debugging (still avoid leaking stack)
    res.status(500).json({ error: 'Error al borrar materia', mensaje: error && error.message ? String(error.message) : undefined });
  }
});

module.exports = router;
