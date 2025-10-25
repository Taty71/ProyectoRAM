const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');

exports.loginUsuario = async (req, res) => {
  try {
    console.log('📥 LOGIN RECIBIDO:', JSON.stringify(req.body));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }
  // Prefer login by DNI. If email is provided (legacy) we can fallback, but system uses DNI.
  const { dni, email, password } = req.body;
  const busca = {};
  if (dni && String(dni).trim() !== '') busca.dni = String(dni).trim();
  else if (email && String(email).trim() !== '') busca.email = String(email).toLowerCase().trim();
  else return res.status(400).json({ error: 'DNI o email requerido' });
  if (!password || String(password).trim() === '') return res.status(400).json({ error: 'Contraseña requerida' });
  let usuario;
  try {
    usuario = await Usuario.findOne({ ...busca, activo: true }).populate('institucion');
  } catch (popErr) {
    // Fallback: si populate o la query lanzan (por ejemplo en entornos mock), intentar sin populate
    console.warn('Warning: fallo en .populate() durante loginUsuario, intentando sin populate:', String(popErr));
    usuario = await Usuario.findOne({ ...busca, activo: true });
    // Si el documento tiene populate como función (caso de mocks) intentar poblar manualmente
    if (usuario && typeof usuario.populate === 'function') {
      try { await usuario.populate('institucion'); } catch (ignore) { /* no bloquear */ }
    }
  }
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!usuario.institucion) {
      if (req.body.institucion) {
        const institucionAsignar = await Institucion.findById(req.body.institucion);
        if (!institucionAsignar || !institucionAsignar.activa) {
          return res.status(400).json({ error: 'La institución seleccionada no existe o no está activa', usuarioId: usuario._id });
        }
          // Asignar institución y nombre para que no falle la validación de usuario
          usuario.institucion = institucionAsignar._id;
          usuario.institucionNombre = institucionAsignar.nombre || usuario.institucionNombre;
          try {
            await usuario.save();
          } catch (saveErr) {
            // Si por alguna razón la validación falla, loguear y continuar intentando poblar para la respuesta
            console.warn('Warning: no se pudo guardar usuario tras asignar institución en login:', String(saveErr));
          }
          try { await usuario.populate('institucion'); } catch (popErr) { /* no bloquear */ }
      } else {
        return res.status(400).json({ error: 'El usuario no tiene una institución asignada', usuarioId: usuario._id });
      }
    }
    if (!usuario.institucion.activa) return res.status(401).json({ error: 'La institución no está activa' });
    // Asegurarse de que institucionNombre esté presente para pasar validaciones
    try {
      if (!usuario.institucionNombre) {
        if (usuario.institucion && usuario.institucion.nombre) {
          usuario.institucionNombre = usuario.institucion.nombre;
        } else if (usuario.institucion) {
          // intentar obtener nombre desde la colección Institucion
          try {
            const inst = await Institucion.findById(usuario.institucion);
            if (inst && inst.nombre) usuario.institucionNombre = inst.nombre;
          } catch (e) {
            console.warn('Warning: fallo al obtener institucion para completar institucionNombre:', String(e));
          }
        }
      }
    } catch (errFill) {
      console.warn('Warning: error al rellenar institucionNombre:', String(errFill));
    }

    usuario.ultimoAcceso = new Date();
    try {
      await usuario.save();
    } catch (saveErrFinal) {
      // Loguear y devolver error para facilitar depuración
      console.error('Error saving usuario on login after filling institucionNombre:', saveErrFinal);
      return res.status(500).json({ error: 'Error al actualizar datos del usuario', detalles: String(saveErrFinal) });
    }
  const token = jwt.sign({ id: usuario._id, dni: usuario.dni, rol: usuario.rol, institucion: usuario.institucion._id, tipo: 'usuario' }, process.env.JWT_SECRET || 'secreto_temporal', { expiresIn: '24h' });
  res.json({ mensaje: 'Login exitoso', token, tipo: 'usuario', usuario: { id: usuario._id, nombre: usuario.nombreCompleto, dni: usuario.dni, email: usuario.email, rol: usuario.rol, especialidades: usuario.especialidades, institucion: { id: usuario.institucion._id, nombre: usuario.institucion.nombre, codigo: usuario.institucion.codigo }, permisos: usuario.permisos } });
  } catch (error) {
    console.error('Error in loginUsuario:', error);
    res.status(500).json({ error: 'Error interno del servidor', detalles: String(error && error.stack ? error.stack : error) });
  }
};

exports.loginEstudiante = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }
    const { idEstudiante, password } = req.body;
    const estudiante = await Estudiante.findOne({ idEstudiante, estadoAcademico: 'activo' }).populate('institucion');
    if (!estudiante) return res.status(401).json({ error: 'Credenciales inválidas' });
    const passwordValido = await estudiante.compararPassword(password);
    if (!passwordValido) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!estudiante.enCicloActual) return res.status(401).json({ error: 'Acceso no autorizado para el ciclo académico actual' });
    if (!estudiante.institucion.activa) return res.status(401).json({ error: 'La institución no está activa' });
    estudiante.ultimoAcceso = new Date();
    await estudiante.save();
    const token = jwt.sign({ id: estudiante._id, idEstudiante: estudiante.idEstudiante, institucion: estudiante.institucion._id, especialidad: estudiante.especialidad, año: estudiante.año, tipo: 'estudiante' }, process.env.JWT_SECRET || 'secreto_temporal', { expiresIn: '24h' });
    res.json({ mensaje: 'Login exitoso', token, tipo: 'estudiante', estudiante: { id: estudiante._id, nombre: estudiante.nombreCompleto, numeroEstudiante: estudiante.numeroEstudiante, especialidad: estudiante.especialidad, año: estudiante.año, division: estudiante.division, institucion: { id: estudiante.institucion._id, nombre: estudiante.institucion.nombre, codigo: estudiante.institucion.codigo } } });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
