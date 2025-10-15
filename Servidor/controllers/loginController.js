const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');

exports.loginUsuario = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email, activo: true }).populate('institucion');
    if (!usuario) return res.status(401).json({ error: 'Credenciales inválidas' });
    const passwordValido = await usuario.compararPassword(password);
    if (!passwordValido) return res.status(401).json({ error: 'Credenciales inválidas' });
    if (!usuario.institucion) {
      if (req.body.institucion) {
        const institucionAsignar = await Institucion.findById(req.body.institucion);
        if (!institucionAsignar || !institucionAsignar.activa) {
          return res.status(400).json({ error: 'La institución seleccionada no existe o no está activa', usuarioId: usuario._id });
        }
        usuario.institucion = institucionAsignar._id;
        await usuario.save();
        await usuario.populate('institucion');
      } else {
        return res.status(400).json({ error: 'El usuario no tiene una institución asignada', usuarioId: usuario._id });
      }
    }
    if (!usuario.institucion.activa) return res.status(401).json({ error: 'La institución no está activa' });
    usuario.ultimoAcceso = new Date();
    await usuario.save();
    const token = jwt.sign({ id: usuario._id, email: usuario.email, rol: usuario.rol, institucion: usuario.institucion._id, tipo: 'usuario' }, process.env.JWT_SECRET || 'secreto_temporal', { expiresIn: '24h' });
    res.json({ mensaje: 'Login exitoso', token, tipo: 'usuario', usuario: { id: usuario._id, nombre: usuario.nombreCompleto, email: usuario.email, rol: usuario.rol, especialidades: usuario.especialidades, institucion: { id: usuario.institucion._id, nombre: usuario.institucion.nombre, codigo: usuario.institucion.codigo }, permisos: usuario.permisos } });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
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
