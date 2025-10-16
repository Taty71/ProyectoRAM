exports.eliminarSolicitudCodigo = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'ID requerido.' });
  try {
    const result = await SolicitudCodigo.findByIdAndDelete(id);
    if (!result) return res.status(404).json({ error: 'Solicitud no encontrada.' });
    return res.json({ mensaje: 'Solicitud eliminada correctamente.' });
  } catch (err) {
    return res.status(500).json({ error: 'Error al eliminar la solicitud.' });
  }
};
const nodemailer = require('nodemailer');
const SolicitudCodigo = require('../models/SolicitudCodigo');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.solicitarCodigo = async (req, res) => {
  const { email, nombre, apellido, rol, institucion, institucionNombre } = req.body;
  
  if (!email || !nombre || !apellido || !rol) {
    return res.status(400).json({ error: 'Nombre, apellido, email y rol son requeridos.' });
  }
  
  try {
    let nombreInstitucion = institucionNombre || 'No especificada';
    let institucionId = institucion; // Guardar el ID recibido
    
    // Si no viene institucionId pero sí nombre, intentar buscarla
    if (!institucionId && institucionNombre) {
      const Institucion = require('../models/Institucion');
      const inst = await Institucion.findOne({ nombre: institucionNombre });
      if (inst) {
        institucionId = inst._id;
        nombreInstitucion = inst.nombre;
      }
    }
    
    // Si viene institucionId pero no nombre, buscar el nombre
    if (institucionId && !institucionNombre) {
      const Institucion = require('../models/Institucion');
      const inst = await Institucion.findById(institucionId);
      if (inst && inst.nombre) {
        nombreInstitucion = inst.nombre;
      }
    }
    
    const solicitud = new SolicitudCodigo({
      nombre,
      apellido,
      email,
      rol,
      institucion: institucionId, // ✅ AGREGAR EL ID AQUÍ
      institucionNombre: nombreInstitucion
    });
    
    await solicitud.save();

    // Email al admin
    await transporter.sendMail({
      from: `"RAM Sistema" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_ADMIN,
      subject: 'Nueva solicitud de código de invitación',
      text: `Nombre: ${nombre}\nApellido: ${apellido}\nEmail: ${email}\nRol: ${rol}\nInstitución: ${nombreInstitucion}`
    });

    return res.json({ mensaje: 'Solicitud registrada y notificada al administrador.' });
  } catch (err) {
    console.error('Error al registrar solicitud:', err);
    return res.status(500).json({ error: 'Error al registrar la solicitud.' });
  }
};
exports.listarSolicitudesCodigo = async (req, res) => {
  try {
    const solicitudes = await SolicitudCodigo.find().populate('institucion').sort({ fecha: -1 });
    const solicitudesConNombre = solicitudes.map(s => ({
      _id: s._id,
      nombre: s.nombre,
      apellido: s.apellido,
      email: s.email,
      rol: s.rol,
      institucion: s.institucion,
      institucionNombre: s.institucionNombre || (s.institucion && s.institucion.nombre) || '',
      fecha: s.fecha,
      estado: s.estado
    }));
    return res.json({ solicitudes: solicitudesConNombre });
  } catch (err) {
    return res.status(500).json({ error: 'Error al obtener las solicitudes.' });
  }
};
