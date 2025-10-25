const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const nodemailer = require('nodemailer');

exports.recuperarUsuario = async (req, res) => {
  try {
    // Aceptamos búsqueda por email o por dni
    const { email, dni } = req.body;

    let usuario = null;
    let estudiante = null;

    if (email) {
      usuario = await Usuario.findOne({ email });
      if (usuario) return await enviarTokenYResponder({ target: usuario, tipo: 'usuario', res });

      estudiante = await Estudiante.findOne({ email });
      if (estudiante) return await enviarTokenYResponder({ target: estudiante, tipo: 'estudiante', res });
    }

    if (dni) {
      usuario = await Usuario.findOne({ dni: String(dni).trim() });
      if (usuario) return await enviarTokenYResponder({ target: usuario, tipo: 'usuario', res });

      estudiante = await Estudiante.findOne({ dni: String(dni).trim() });
      if (estudiante) return await enviarTokenYResponder({ target: estudiante, tipo: 'estudiante', res });
    }

    return res.status(404).json({ error: 'Usuario no encontrado' });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};


// Helper to generate token, send email (if configured) and respond
async function enviarTokenYResponder({ target, tipo, res }) {
  try {
    const id = target._id || target.id;
    const jwtSecret = process.env.JWT_SECRET || 'secreto_temporal';
    const expiresIn = process.env.RECUPERACION_EXP || '1h';
    const tokenTipo = tipo === 'usuario' ? 'recuperacion_usuario' : 'recuperacion_estudiante';
    const token = jwt.sign({ id, tipo: tokenTipo }, jwtSecret, { expiresIn });

    // Prepare reset link for frontend
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetPath = process.env.RESET_PATH || '/reset-password';
    const resetLink = `${frontendUrl}${resetPath}?token=${encodeURIComponent(token)}`;

    // Attempt to send email if SMTP config is present (fallback to EMAIL_* env vars)
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT) || 587;
    const smtpSecure = process.env.SMTP_SECURE === 'true' || false; // false by default (TLS via STARTTLS)
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const from = process.env.FROM_EMAIL || process.env.EMAIL_ADMIN || smtpUser || 'no-reply@ram.local';
      const to = target.email;
      const subject = 'Recuperación de contraseña - R.A.M.';
      const text = `Hola ${target.nombre || ''},\n\nHemos recibido una solicitud para restablecer la contraseña. Pulsa el siguiente enlace para cambiar tu contraseña:\n\n${resetLink}\n\nSi no has solicitado este cambio, ignora este correo.`;
      const html = `<p>Hola ${target.nombre || ''},</p><p>Hemos recibido una solicitud para restablecer la contraseña. Pulsa el siguiente enlace para cambiar tu contraseña:</p><p><a href="${resetLink}">${resetLink}</a></p><p>Si no has solicitado este cambio, ignora este correo.</p>`;

      await transporter.sendMail({ from, to, subject, text, html });

      const responsePayload = { mensaje: 'Instrucciones de recuperación enviadas al email' };
      // In development, include token for convenience
      if (process.env.NODE_ENV !== 'production') responsePayload.token = token;
      return res.json(responsePayload);
    }

    // If no SMTP configured, return token in dev to allow testing
    const responsePayload = { mensaje: 'Token de recuperación generado (no se envió email, SMTP no configurado)' };
    if (process.env.NODE_ENV !== 'production') responsePayload.token = token;
    return res.json(responsePayload);
  } catch (err) {
    console.error('Error al generar/enviar token de recuperación:', err);
    // If token was created but mail failed, return token in dev for testing
    if (process.env.NODE_ENV !== 'production') {
      const id = target._id || target.id;
      const token = jwt.sign({ id, tipo: tipo === 'usuario' ? 'recuperacion_usuario' : 'recuperacion_estudiante' }, process.env.JWT_SECRET || 'secreto_temporal', { expiresIn: process.env.RECUPERACION_EXP || '1h' });
      return res.status(200).json({ mensaje: 'Error al enviar email, token devuelto en modo desarrollo', token });
    }
    return res.status(500).json({ error: 'Error al enviar email de recuperación' });
  }
}

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
