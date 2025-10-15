const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');

exports.recuperarUsuario = async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    const token = jwt.sign({ id: usuario._id, tipo: 'recuperacion_usuario' }, process.env.JWT_SECRET || 'secreto_temporal', { expiresIn: '1h' });
    // ... código para enviar email ...
    res.json({ mensaje: 'Instrucciones de recuperación enviadas al email', token });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.recuperarEstudiante = async (req, res) => {
  try {
    const { email } = req.body;
    const estudiante = await Estudiante.findOne({ email });
    if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado' });
    const token = jwt.sign({ id: estudiante._id, tipo: 'recuperacion_estudiante' }, process.env.JWT_SECRET || 'secreto_temporal', { expiresIn: '1h' });
    // ... código para enviar email ...
    res.json({ mensaje: 'Instrucciones de recuperación enviadas al email', token });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
