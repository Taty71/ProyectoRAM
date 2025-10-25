const fs = require('fs');
const path = require('path');
const conectarBD = require('../config/database');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Institucion = require('../models/Institucion');

async function main() {
  await conectarBD();
  try {
    const query = { $or: [ { institucionNombre: { $exists: false } }, { institucionNombre: '' } ] };
    const usuarios = await Usuario.find(query).lean();
    console.log(`Usuarios encontrados sin institucionNombre: ${usuarios.length}`);

    const results = [];
    for (const u of usuarios) {
      const out = { userId: u._id.toString(), institucion: u.institucion ? u.institucion.toString() : null, updated: false, reason: null };
      if (!u.institucion) {
        out.reason = 'sin referencia a institucion';
        results.push(out);
        continue;
      }
      try {
        const inst = await Institucion.findById(u.institucion).lean();
        if (!inst || !inst.nombre) {
          out.reason = 'institucion no encontrada o sin nombre';
          results.push(out);
          continue;
        }
        const update = await Usuario.updateOne({ _id: u._id }, { $set: { institucionNombre: inst.nombre } });
        out.updated = update.modifiedCount > 0 || update.nModified > 0 || update.ok === 1;
        out.institucionNombre = inst.nombre;
        results.push(out);
      } catch (err) {
        out.reason = String(err);
        results.push(out);
      }
    }

    const outDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `fill_institucion_nombre_report_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify({ timestamp: new Date().toISOString(), results }, null, 2), 'utf8');
    console.log(`Reporte escrito en ${outFile}`);

    await mongoose.connection.close();
    console.log('Proceso completado.');
  } catch (err) {
    console.error('Error en script:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { main };
