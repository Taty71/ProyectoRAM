const CodigoInvitacion = require('../models/CodigoInvitacion');
const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

exports.validarCodigo = async (req, res) => {
  try {
    const { codigo } = req.body;
    if (!codigo) return res.status(400).json({ error: 'Código es requerido' });
    const codigoUpper = codigo.toUpperCase();
    // Buscar de forma tolerante: soportar documentos antiguos sin campos `activo` o `usosRestantes`
    const codigoInvitacion = await CodigoInvitacion.findOne({
      codigo: codigoUpper,
      $and: [
        { $or: [{ activo: true }, { activo: { $exists: false } }] },
        { $or: [{ usosRestantes: { $gt: 0 } }, { usosRestantes: { $exists: false } }] }
      ]
    });
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

// Función para generar y enviar código por email
const nodemailer = require('nodemailer');
const SolicitudCodigo = require('../models/SolicitudCodigo');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.generarYEnviarCodigo = async (req, res) => {
  const { solicitudId, usos, diasExpiracion, institucionId: institucionIdOverride } = req.body;
  
  try {
    console.log('📨 Procesando aprobación de solicitud:', solicitudId);
    console.log('📊 Datos recibidos:', { usos, diasExpiracion });
    
    const solicitud = await SolicitudCodigo.findById(solicitudId);
    
    if (!solicitud) {
      console.error('❌ Solicitud no encontrada');
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Generar código único
    let codigoUnico;
    let intentos = 0;
    do {
      codigoUnico = Math.random().toString(36).substring(2, 10).toUpperCase();
      intentos++;
      if (intentos > 10) {
        throw new Error('No se pudo generar un código único');
      }
    } while (await CodigoInvitacion.findOne({ codigo: codigoUnico }));

    // Calcular fecha de expiración
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + (diasExpiracion || 30));

    // 🔍 LOG: Verificar fechas
    console.log('📅 FECHAS:', {
      fechaActual: new Date(),
      diasAgregar: diasExpiracion,
      fechaExpiracion: fechaExpiracion,
      fechaExpiracionISO: fechaExpiracion.toISOString()
    });

    const rolNormalizado = solicitud.rol.toLowerCase();
    
    // Preferir override enviado por el frontend (admin seleccionó institución)
    let institucionId = institucionIdOverride || solicitud.institucion;
    if (!institucionId && solicitud.institucionNombre) {
      const Institucion = require('../models/Institucion');
      // Buscar por código exacto o por nombre (case-insensitive)
      const byCodigo = await Institucion.findOne({ codigo: solicitud.institucionNombre });
      if (byCodigo) {
        institucionId = byCodigo._id;
      } else {
        const escaped = solicitud.institucionNombre.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp('^' + escaped + '$', 'i');
        const byName = await Institucion.findOne({ nombre: regex });
        if (byName) institucionId = byName._id;
      }
    }

    const nuevoCodigo = new CodigoInvitacion({
      codigo: codigoUnico,
      rol: rolNormalizado,
      nombre: solicitud.nombre,
      apellido: solicitud.apellido,
      usosMaximos: usos || 1,
      usosRestantes: usos || 1,
      fechaExpiracion,
      institucion: institucionId,
      activo: true
    });

    console.log('📝 CÓDIGO A GUARDAR:', {
      codigo: nuevoCodigo.codigo,
      rol: nuevoCodigo.rol,
      fechaExpiracion: nuevoCodigo.fechaExpiracion,
      usosMaximos: nuevoCodigo.usosMaximos,
      activo: nuevoCodigo.activo
    });

    await nuevoCodigo.save();
    
    // 🔍 LOG: Verificar código guardado
    const codigoGuardado = await CodigoInvitacion.findOne({ codigo: codigoUnico });
    console.log('✅ CÓDIGO GUARDADO EN BD:', {
      codigo: codigoGuardado.codigo,
      fechaExpiracion: codigoGuardado.fechaExpiracion,
      activo: codigoGuardado.activo
    });

    // ... resto del código (email, etc.)

    // Enviar email al usuario con el código
    const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2980b9, #3498db); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .codigo-box { background: white; border: 3px solid #2980b9; border-radius: 10px; padding: 20px; margin: 20px 0; text-align: center; }
          .codigo { font-size: 32px; font-weight: bold; color: #2980b9; letter-spacing: 4px; font-family: monospace; }
          .info { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; color: #7f8c8d; font-size: 12px; margin-top: 20px; }
          .button { display: inline-block; background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 ¡Código de Invitación Aprobado!</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${solicitud.nombre} ${solicitud.apellido}</strong>,</p>
            <p>Tu solicitud para unirte al Sistema R.A.M. ha sido aprobada. Aquí está tu código de invitación:</p>
            
            <div class="codigo-box">
              <div class="codigo">${codigoUnico}</div>
            </div>

            <div class="info">
              <p><strong>📋 Detalles del código:</strong></p>
              <ul>
                <li><strong>Rol asignado:</strong> ${solicitud.rol}</li>
                <li><strong>Usos disponibles:</strong> ${usos || 1}</li>
                <li><strong>Válido hasta:</strong> ${fechaExpiracion.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</li>
                <li><strong>Institución:</strong> ${solicitud.institucionNombre || 'IPET 379 "ALFREDO BENOIT MOLET"'}</li>
              </ul>
            </div>

            <p><strong>📝 Instrucciones para registrarte:</strong></p>
            <ol>
              <li>Ve a la página de registro del sistema</li>
              <li>Completa tus datos personales</li>
              <li>Ingresa el código: <strong>${codigoUnico}</strong></li>
              <li>¡Listo! Ya podrás acceder al sistema</li>
            </ol>

            <p style="text-align: center;">
              <a href="http://localhost:5173" class="button">Ir al Sistema RAM</a>
            </p>

            <p style="color: #e74c3c; font-size: 14px;"><strong>⚠️ Importante:</strong> Guarda este código en un lugar seguro. Lo necesitarás para completar tu registro.</p>
          </div>
          <div class="footer">
            <p>Sistema R.A.M. - Reforzar, Aprender, Mejorar</p>
            <p>Este es un mensaje automático, por favor no respondas a este correo.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('📧 Enviando email a:', solicitud.email);

    await transporter.sendMail({
      from: `"Sistema RAM - ${solicitud.institucionNombre || 'Institución Educativa'}" <${process.env.EMAIL_USER}>`,
      to: solicitud.email,
      subject: `✅ Tu código de invitación - Sistema RAM`,
      html: emailHTML,
      text: `
Hola ${solicitud.nombre} ${solicitud.apellido},

Tu código de invitación: ${codigoUnico}

Rol: ${solicitud.rol}
Usos disponibles: ${usos || 1}
Válido hasta: ${fechaExpiracion.toLocaleDateString('es-ES')}

Usa este código para registrarte en el Sistema R.A.M.

---
Sistema R.A.M. - Reforzar, Aprender, Mejorar
      `
    });

    console.log('✅ Email enviado exitosamente');

    // Actualizar estado de la solicitud
    await SolicitudCodigo.findByIdAndUpdate(solicitudId, { 
      estado: 'aprobada' 
    });

    console.log('✅ Solicitud marcada como aprobada');

    res.json({ 
      mensaje: 'Código generado y enviado exitosamente',
      codigo: codigoUnico,
      email: solicitud.email
    });

  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('❌ Stack trace:', error.stack);
    res.status(500).json({ 
      error: 'Error al generar el código de invitación',
      detalle: error.message 
    });
  }
};