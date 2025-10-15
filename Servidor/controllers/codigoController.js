const CodigoInvitacion = require('../models/CodigoInvitacion');
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

exports.validarCodigo = async (req, res) => {
  try {
    const { codigo } = req.body;
    const codigoInvitacion = await CodigoInvitacion.findOne({ codigo: codigo.toUpperCase(), activo: true, usosRestantes: { $gt: 0 } });
    if (!codigoInvitacion) return res.status(404).json({ error: 'Código de invitación inválido, expirado o agotado' });
    if (codigoInvitacion.fechaExpiracion && codigoInvitacion.fechaExpiracion < new Date()) return res.status(400).json({ error: 'El código de invitación ha expirado' });
    res.json({ valido: true, rol: codigoInvitacion.rol, nombre: codigoInvitacion.nombre, apellido: codigoInvitacion.apellido, mensaje: `Código válido para registro de ${codigoInvitacion.rol}` });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.crearCodigo = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal');
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario || usuario.rol !== 'administrador') return res.status(403).json({ error: 'Solo los administradores pueden crear códigos de invitación' });
    const { rol, nombre, apellido, usos, fechaExpiracion } = req.body;
    let codigoUnico;
    let intentos = 0;
    do {
      codigoUnico = Math.random().toString(36).substr(2, 9).toUpperCase();
      intentos++;
      if (intentos > 10) throw new Error('No se pudo generar un código único');
    } while (await CodigoInvitacion.findOne({ codigo: codigoUnico }));
    const nuevoCodigo = new CodigoInvitacion({ codigo: codigoUnico, rol, nombre, apellido, usosMaximos: usos, usosRestantes: usos, fechaExpiracion: fechaExpiracion ? new Date(fechaExpiracion) : null, creadoPor: usuario._id, activo: true });
    await nuevoCodigo.save();
    res.status(201).json({ mensaje: 'Código de invitación creado exitosamente', codigo: nuevoCodigo.codigo, rol: nuevoCodigo.rol, nombre: nuevoCodigo.nombre, apellido: nuevoCodigo.apellido, usos: nuevoCodigo.usosMaximos, fechaExpiracion: nuevoCodigo.fechaExpiracion });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.listarCodigos = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal');
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario || usuario.rol !== 'administrador') return res.status(403).json({ error: 'Solo los administradores pueden ver códigos de invitación' });
    const codigos = await CodigoInvitacion.find().populate('creadoPor', 'nombre apellido email').sort({ fechaCreacion: -1 });
    res.json({ codigos: codigos.map(codigo => ({ _id: codigo._id, codigo: codigo.codigo, rol: codigo.rol, nombre: codigo.nombre, apellido: codigo.apellido, usosMaximos: codigo.usosMaximos, usosRestantes: codigo.usosRestantes, fechaCreacion: codigo.fechaCreacion, fechaExpiracion: codigo.fechaExpiracion, activo: codigo.activo, creadoPor: codigo.creadoPor })) });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

exports.desactivarCodigo = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token requerido' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal');
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario || usuario.rol !== 'administrador') return res.status(403).json({ error: 'Solo los administradores pueden desactivar códigos' });
    const codigo = await CodigoInvitacion.findById(req.params.id);
    if (!codigo) return res.status(404).json({ error: 'Código no encontrado' });
    codigo.activo = false;
    await codigo.save();
    res.json({ mensaje: 'Código desactivado exitosamente', codigo: codigo.codigo });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
