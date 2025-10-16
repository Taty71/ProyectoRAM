/*
  Script seguro para inicializar campos faltantes en la colección `codigoinvitacions`.
  - Añade `usosMaximos`, `usosRestantes` y `activo` cuando no existan.
  - Deja los valores actuales intactos si ya existen.

  USO:
  1) Haz backup de tu BD antes de ejecutar.
  2) Desde la carpeta Servidor: node scripts/inicializar_codigos_campos.js
  3) Revisa el log.
*/

const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const CodigoInvitacion = require('../models/CodigoInvitacion');

async function run() {
  try {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/ram_db';
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Conectado a MongoDB:', uri);

    const codigos = await CodigoInvitacion.find({ $or: [ { usosMaximos: { $exists: false } }, { usosRestantes: { $exists: false } }, { activo: { $exists: false } } ] });
    console.log(`Documentos a actualizar: ${codigos.length}`);

    for (const c of codigos) {
      const update = {};
      if (typeof c.usosMaximos === 'undefined') update.usosMaximos = 1;
      if (typeof c.usosRestantes === 'undefined') update.usosRestantes = (typeof c.usosMaximos === 'number' ? c.usosMaximos : 1);
      if (typeof c.activo === 'undefined') update.activo = true;

      if (Object.keys(update).length > 0) {
        await CodigoInvitacion.updateOne({ _id: c._id }, { $set: update });
        console.log(`Actualizado ${c.codigo}:`, update);
      }
    }

    console.log('Migración completada');
    process.exit(0);
  } catch (err) {
    console.error('Error durante la migración:', err);
    process.exit(1);
  }
}

run();
