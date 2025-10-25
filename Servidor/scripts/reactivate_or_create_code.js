/**
 * Script para reactivar un código existente o crear uno nuevo si se indica.
 * Uso:
 *   node reactivate_or_create_code.js <CODIGO> [--usos=1] [--expira=2025-10-25] [--create] [--rol=estudiante]
 * Ejemplos:
 *   node reactivate_or_create_code.js RMNLWEG8 --usos=1 --expira=2025-10-25
 *   node reactivate_or_create_code.js RMNLWEG8 --create --rol=estudiante --usos=1
 *
 * Precaución: ejecutar solo en entorno controlado o con backup.
 */

const mongoose = require('mongoose');
const CodigoInvitacion = require('../models/CodigoInvitacion');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ram_db';

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { code: null, usos: undefined, expira: undefined, create: false, rol: undefined };
  args.forEach(a => {
    if (!result.code && !a.startsWith('--')) result.code = a;
    else if (a.startsWith('--usos=')) result.usos = parseInt(a.split('=')[1], 10);
    else if (a.startsWith('--expira=')) result.expira = a.split('=')[1];
    else if (a === '--create') result.create = true;
    else if (a.startsWith('--rol=')) result.rol = a.split('=')[1];
  });
  return result;
}

(async () => {
  const opts = parseArgs();
  if (!opts.code) {
    console.error('Falta el código. Uso: node reactivate_or_create_code.js <CODIGO> [--usos=1] [--expira=YYYY-MM-DD] [--create] [--rol=estudiante]');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Conectado a MongoDB:', uri);
    const codeUpper = opts.code.toUpperCase();
    let c = await CodigoInvitacion.findOne({ codigo: codeUpper });
    if (c) {
      console.log('Código encontrado:', c.codigo, '-> reactivando/ajustando');
      c.activo = true;
      if (typeof opts.usos === 'number') {
        c.usosMaximos = opts.usos;
        c.usosRestantes = opts.usos;
      } else if (typeof c.usosMaximos === 'number' && (!c.usosRestantes || c.usosRestantes <= 0)) {
        c.usosRestantes = c.usosMaximos || 1;
      }
      if (opts.expira) {
        const d = new Date(opts.expira);
        if (isNaN(d)) console.warn('Fecha de expiración inválida, no se actualizó');
        else c.fechaExpiracion = d;
      }
      if (opts.rol) c.rol = opts.rol;
      c.activo = true;
      await c.save();
      console.log('Actualizado:', JSON.stringify({ codigo: c.codigo, rol: c.rol, usosMaximos: c.usosMaximos, usosRestantes: c.usosRestantes, fechaExpiracion: c.fechaExpiracion, activo: c.activo }, null, 2));
    } else {
      if (!opts.create) {
        console.log('Código no encontrado. Si querés crearlo, re-ejecutá con --create y opcionales --usos/--expira/--rol');
        process.exit(0);
      }
      const rol = opts.rol || 'estudiante';
      const usos = typeof opts.usos === 'number' ? opts.usos : 1;
      const fechaExp = opts.expira ? new Date(opts.expira) : null;
      const nuevo = new CodigoInvitacion({ codigo: codeUpper, rol, nombre: 'Generado', apellido: 'Admin', usosMaximos: usos, usosRestantes: usos, fechaExpiracion: fechaExp, activo: true });
      await nuevo.save();
      console.log('Código creado:', JSON.stringify({ codigo: nuevo.codigo, rol: nuevo.rol, usosMaximos: nuevo.usosMaximos, usosRestantes: nuevo.usosRestantes, fechaExpiracion: nuevo.fechaExpiracion, activo: nuevo.activo }, null, 2));
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error al (re)activar/crear código:', err);
    process.exit(1);
  }
})();
