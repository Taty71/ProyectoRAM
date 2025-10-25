const mongoose = require('mongoose');
const CodigoInvitacion = require('../models/CodigoInvitacion');

const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ram_db';
const codeToCheck = process.argv[2] || 'RMNLWEG8';

(async () => {
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Conectado a MongoDB:', uri);
    const c = await CodigoInvitacion.findOne({ codigo: codeToCheck.toUpperCase() }).lean();
    if (!c) {
      console.log(`Código ${codeToCheck} no encontrado.`);
      process.exit(0);
    }
    console.log('Documento encontrado:');
    console.log(JSON.stringify({
      _id: c._id,
      codigo: c.codigo,
      rol: c.rol,
      usosMaximos: c.usosMaximos,
      usosRestantes: c.usosRestantes,
      activo: c.activo,
      usado: c.usado,
      fechaExpiracion: c.fechaExpiracion,
      institucion: c.institucion,
      creadoAt: c.createdAt || c.created_at || null,
      updatedAt: c.updatedAt || c.updated_at || null
    }, null, 2));
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error al inspeccionar el código:', err);
    process.exit(1);
  }
})();
