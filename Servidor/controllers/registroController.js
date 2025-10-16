const { validationResult } = require('express-validator');
const CodigoInvitacion = require('../models/CodigoInvitacion');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');

exports.registroUsuario = async (req, res) => {
  try {
    // 🔍 LOG: Ver qué llega
    console.log('📥 DATOS RECIBIDOS:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ ERRORES DE VALIDACIÓN:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }
    
    const { email, password, nombre, apellido, dni, rol, institucion, especialidades, ciclo, cursosACargo, codigoInvitacion } = req.body;
    
    // 🔍 LOG: Buscar código
    console.log('🔍 Buscando código:', codigoInvitacion);

    // Búsqueda tolerante para soportar documentos antiguos que no tengan campos `activo` o `usosRestantes`
    const codigo = await CodigoInvitacion.findOne({
      codigo: codigoInvitacion,
      $and: [
        { $or: [{ activo: true }, { activo: { $exists: false } }] },
        { $or: [{ usosRestantes: { $gt: 0 } }, { usosRestantes: { $exists: false } }] }
      ]
    });

    if (!codigo) {
      console.log('❌ Código no encontrado o sin usos');
      return res.status(400).json({ error: 'Código de invitación inválido, expirado o agotado' });
    }
    
    // 🔍 LOG: Verificar fecha de expiración
    console.log('📅 Código encontrado:', {
      codigo: codigo.codigo,
      fechaExpiracion: codigo.fechaExpiracion,
      fechaActual: new Date(),
      estaExpirado: codigo.fechaExpiracion && codigo.fechaExpiracion < new Date()
    });
    
    if (codigo.fechaExpiracion && codigo.fechaExpiracion < new Date()) {
      console.log('❌ Código expirado');
      return res.status(400).json({ 
        error: 'El código de invitación ha expirado',
        detalles: {
          fechaExpiracion: codigo.fechaExpiracion,
          fechaActual: new Date()
        }
      });
    }
    
    // 🔍 LOG: Verificar rol
    console.log('🔍 Verificando rol:', {
      rolDelCodigo: codigo.rol,
      rolSolicitado: rol,
      coinciden: codigo.rol === rol
    });
    
    if (codigo.rol !== rol) {
      console.log(`❌ Rol incorrecto`);
      return res.status(400).json({ error: `Este código es para registro de ${codigo.rol}, no para ${rol}` });
    }
    
  
    // Intentar resolver la institución: aceptar `institucion` (ObjectId) o `institucionNombre` (fallback)
    let institucionIdToUse = institucion;
    if (!institucionIdToUse && req.body.institucionNombre) {
      const nombreOrCodigo = req.body.institucionNombre;
      // Buscar por código exacto primero
      const byCodigo = await Institucion.findOne({ codigo: nombreOrCodigo });
      if (byCodigo) {
        institucionIdToUse = byCodigo._id;
      } else {
        // Buscar por nombre (case-insensitive, coincidencia exacta)
        const escaped = nombreOrCodigo.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp('^' + escaped + '$', 'i');
        const byName = await Institucion.findOne({ nombre: regex });
        if (byName) institucionIdToUse = byName._id;
      }
    }

      // SI AÚN NO SE RESOLVIÓ LA INSTITUCIÓN, intentar obtenerla desde el código de invitación
      if (!institucionIdToUse && codigo && codigo.institucion) {
        console.log('🔁 Usando institución asociada al código de invitación como fallback:', codigo.institucion);
        institucionIdToUse = codigo.institucion;
      }

    const institucionExiste = institucionIdToUse ? await Institucion.findById(institucionIdToUse) : null;
    if (!institucionExiste) return res.status(400).json({ error: 'La institución especificada no existe' });
    const usuarioExistente = await Usuario.findOne({ $or: [{ email }, { dni }] });
    if (usuarioExistente) return res.status(409).json({ error: 'El usuario ya existe (email o DNI duplicado)' });
    let materiasIds = [];
    if (Array.isArray(cursosACargo) && cursosACargo.length > 0) {
      const Materia = require('../models/Materia');
      for (const curso of cursosACargo) {
        const nombreMateria = curso.materia;
        const codigoMateria = `${curso.materia.substring(0,3).toUpperCase()}${curso.curso}${curso.division}`;
        // Usar la institución resuelta (institucionIdToUse) para las materias creadas
        const nuevaMateria = new Materia({ nombre: nombreMateria, codigo: codigoMateria, institucion: institucionIdToUse, ciclo: ciclo === 'cbu' ? 'CBU' : 'segundo', especialidad: curso.especialidad || '', año: parseInt(curso.curso), profesor: null, activa: true });
        await nuevaMateria.save();
        materiasIds.push(nuevaMateria._id);
      }
    }
  const nuevoUsuario = new Usuario({ email, password, nombre, apellido, dni, rol, institucion: institucionIdToUse, especialidades: especialidades || [], ciclo, materias: materiasIds });
    await nuevoUsuario.save();
    // Decrementar usosRestantes sólo si existe; si no existe, inicializar campos para consistencia
    if (typeof codigo.usosRestantes === 'number') {
      codigo.usosRestantes = Math.max(0, codigo.usosRestantes - 1);
    } else {
      codigo.usosMaximos = codigo.usosMaximos || 1;
      codigo.usosRestantes = Math.max(0, (codigo.usosMaximos || 1) - 1);
    }
    // Si no existe el campo activo, asegurarlo
    if (typeof codigo.activo === 'undefined') codigo.activo = true;
    await codigo.save();
    if (materiasIds.length > 0) {
      const Materia = require('../models/Materia');
      await Materia.updateMany({ _id: { $in: materiasIds } }, { $set: { profesor: nuevoUsuario._id } });
    }
    res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: { id: nuevoUsuario._id, nombre: nuevoUsuario.nombreCompleto, email: nuevoUsuario.email, rol: nuevoUsuario.rol, dni: nuevoUsuario.dni, materias: materiasIds } });
  } catch (error) {
    console.error('Error en registroUsuario:', error);
    // Si es un error de validación de Mongoose, devolver 400 con detalles
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Error de validación al guardar usuario', detalles: error.message });
    }
    // Manejar error de clave duplicada (por ejemplo email o dni único)
    if (error.code && error.code === 11000) {
      const dupField = Object.keys(error.keyValue || {})[0] || 'campo';
      return res.status(409).json({ error: `Valor duplicado en ${dupField}`, detalles: error.keyValue });
    }
    res.status(500).json({ error: 'Error interno del servidor', detalles: error.message });
  }
};

exports.registroEstudiante = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }
    const { codigoInvitacion, ...estudianteData } = req.body;
    const codigo = await CodigoInvitacion.findOne({
      codigo: codigoInvitacion,
      $and: [
        { $or: [{ activo: true }, { activo: { $exists: false } }] },
        { $or: [{ usosRestantes: { $gt: 0 } }, { usosRestantes: { $exists: false } }] }
      ]
    });
    if (!codigo) return res.status(400).json({ error: 'Código de invitación inválido, expirado o agotado' });
    if (codigo.fechaExpiracion && codigo.fechaExpiracion < new Date()) return res.status(400).json({ error: 'El código de invitación ha expirado' });
    if (codigo.rol !== 'estudiante') return res.status(400).json({ error: `Este código es para registro de ${codigo.rol}, no para estudiante` });
    const institucionExiste = await Institucion.findById(estudianteData.institucion);
    if (!institucionExiste) return res.status(400).json({ error: 'La institución especificada no existe' });
    const estudianteExistente = await Estudiante.findOne({ $or: [ { idEstudiante: estudianteData.idEstudiante }, { email: estudianteData.email }, { dni: estudianteData.dni } ] });
    if (estudianteExistente) return res.status(409).json({ error: 'El estudiante ya existe (número de estudiante, email o DNI duplicado)' });
    const nuevoEstudiante = new Estudiante({ ...estudianteData, fechaIngreso: new Date(), estadoAcademico: 'activo' });
    await nuevoEstudiante.save();
    if (typeof codigo.usosRestantes === 'number') {
      codigo.usosRestantes = Math.max(0, codigo.usosRestantes - 1);
    } else {
      codigo.usosMaximos = codigo.usosMaximos || 1;
      codigo.usosRestantes = Math.max(0, (codigo.usosMaximos || 1) - 1);
    }
    if (typeof codigo.activo === 'undefined') codigo.activo = true;
    await codigo.save();
    res.status(201).json({ mensaje: 'Estudiante registrado exitosamente', estudiante: { id: nuevoEstudiante._id, nombre: nuevoEstudiante.nombreCompleto, idEstudiante: nuevoEstudiante.idEstudiante, email: nuevoEstudiante.email, especialidad: nuevoEstudiante.especialidad, año: nuevoEstudiante.año } });
  } catch (error) {
    console.error('Error en registroEstudiante:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Error de validación al guardar estudiante', detalles: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor', detalles: error.message });
  }
};
