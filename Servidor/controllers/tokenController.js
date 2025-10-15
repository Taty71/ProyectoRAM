const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');

exports.verificarToken = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Token no proporcionado' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal');
    let datosUsuario = null;
    if (decoded.tipo === 'usuario') {
      const usuario = await Usuario.findById(decoded.id).populate('institucion').select('-password');
      if (!usuario) return res.status(401).json({ error: 'Token inválido' });
      datosUsuario = { tipo: 'usuario', id: usuario._id, nombre: usuario.nombreCompleto, email: usuario.email, rol: usuario.rol, especialidades: usuario.especialidades, institucion: { id: usuario.institucion._id, nombre: usuario.institucion.nombre, codigo: usuario.institucion.codigo }, permisos: usuario.permisos };
    } else if (decoded.tipo === 'estudiante') {
      const estudiante = await Estudiante.findById(decoded.id).populate('institucion').select('-password');
      if (!estudiante) return res.status(401).json({ error: 'Token inválido' });
      datosUsuario = { tipo: 'estudiante', id: estudiante._id, nombre: estudiante.nombreCompleto, numeroEstudiante: estudiante.numeroEstudiante, especialidad: estudiante.especialidad, año: estudiante.año, division: estudiante.division, institucion: { id: estudiante.institucion._id, nombre: estudiante.institucion.nombre, codigo: estudiante.institucion.codigo } };
    } else {
      return res.status(401).json({ error: 'Tipo de token no válido' });
    }
    res.json({ valido: true, usuario: datosUsuario });
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
  }
};
