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
    
    const codigo = await CodigoInvitacion.findOne({ codigo: codigoInvitacion, activo: true, usosRestantes: { $gt: 0 } });
    
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
    
  
    const institucionExiste = await Institucion.findById(institucion);
    if (!institucionExiste) return res.status(400).json({ error: 'La institución especificada no existe' });
    const usuarioExistente = await Usuario.findOne({ $or: [{ email }, { dni }] });
    if (usuarioExistente) return res.status(409).json({ error: 'El usuario ya existe (email o DNI duplicado)' });
    let materiasIds = [];
    if (Array.isArray(cursosACargo) && cursosACargo.length > 0) {
      const Materia = require('../models/Materia');
      for (const curso of cursosACargo) {
        const nombreMateria = curso.materia;
        const codigoMateria = `${curso.materia.substring(0,3).toUpperCase()}${curso.curso}${curso.division}`;
        const nuevaMateria = new Materia({ nombre: nombreMateria, codigo: codigoMateria, institucion, ciclo: ciclo === 'cbu' ? 'CBU' : 'segundo', especialidad: curso.especialidad || '', año: parseInt(curso.curso), profesor: null, activa: true });
        await nuevaMateria.save();
        materiasIds.push(nuevaMateria._id);
      }
    }
    const nuevoUsuario = new Usuario({ email, password, nombre, apellido, dni, rol, institucion, especialidades: especialidades || [], ciclo, materias: materiasIds });
    await nuevoUsuario.save();
    codigo.usosRestantes -= 1;
    await codigo.save();
    if (materiasIds.length > 0) {
      const Materia = require('../models/Materia');
      await Materia.updateMany({ _id: { $in: materiasIds } }, { $set: { profesor: nuevoUsuario._id } });
    }
    res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: { id: nuevoUsuario._id, nombre: nuevoUsuario.nombreCompleto, email: nuevoUsuario.email, rol: nuevoUsuario.rol, dni: nuevoUsuario.dni, materias: materiasIds } });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.registroEstudiante = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }
    const { codigoInvitacion, ...estudianteData } = req.body;
    const codigo = await CodigoInvitacion.findOne({ codigo: codigoInvitacion, activo: true, usosRestantes: { $gt: 0 } });
    if (!codigo) return res.status(400).json({ error: 'Código de invitación inválido, expirado o agotado' });
    if (codigo.fechaExpiracion && codigo.fechaExpiracion < new Date()) return res.status(400).json({ error: 'El código de invitación ha expirado' });
    if (codigo.rol !== 'estudiante') return res.status(400).json({ error: `Este código es para registro de ${codigo.rol}, no para estudiante` });
    const institucionExiste = await Institucion.findById(estudianteData.institucion);
    if (!institucionExiste) return res.status(400).json({ error: 'La institución especificada no existe' });
    const estudianteExistente = await Estudiante.findOne({ $or: [ { idEstudiante: estudianteData.idEstudiante }, { email: estudianteData.email }, { dni: estudianteData.dni } ] });
    if (estudianteExistente) return res.status(409).json({ error: 'El estudiante ya existe (número de estudiante, email o DNI duplicado)' });
    const nuevoEstudiante = new Estudiante({ ...estudianteData, fechaIngreso: new Date(), estadoAcademico: 'activo' });
    await nuevoEstudiante.save();
    codigo.usosRestantes -= 1;
    await codigo.save();
    res.status(201).json({ mensaje: 'Estudiante registrado exitosamente', estudiante: { id: nuevoEstudiante._id, nombre: nuevoEstudiante.nombreCompleto, idEstudiante: nuevoEstudiante.idEstudiante, email: nuevoEstudiante.email, especialidad: nuevoEstudiante.especialidad, año: nuevoEstudiante.año } });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
