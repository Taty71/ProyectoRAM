const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('📧 Configuración de email:');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NO DEFINIDA');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

console.log('\n📨 Enviando email de prueba...\n');

transporter.sendMail({
  from: `"Sistema RAM TEST" <${process.env.EMAIL_USER}>`,
  to: 'crisbmaia@gmail.com',
  subject: 'Email de prueba - Sistema RAM',
  html: '<h1>✅ Test de email</h1><p>Si recibes este email, la configuración funciona correctamente.</p>'
})
.then(() => {
  console.log('✅ Email enviado correctamente a crisbmaia@gmail.com');
  console.log('📬 Revisa tu bandeja de entrada o SPAM');
  process.exit(0);
})
.catch(err => {
  console.error('❌ Error al enviar email:');
  console.error(err.message);
  console.error('\n🔍 Posibles causas:');
  console.error('1. Contraseña de aplicación incorrecta');
  console.error('2. Verificación en 2 pasos no activada en Gmail');
  console.error('3. Bloqueado por seguridad de Gmail');
  process.exit(1);
});