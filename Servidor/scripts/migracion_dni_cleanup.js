const fs = require('fs');
const path = require('path');
const conectarBD = require('../config/database');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');

async function main({ fix = false } = {}) {
  await conectarBD();
  try {
    const report = {
      timestamp: new Date().toISOString(),
      usuarios: { sinDNI: [], duplicados: [] },
      estudiantes: { sinDNI: [], duplicados: [] }
    };

    // Usuarios: documentos sin dni o con dni vacío
    const usuariosSinDni = await Usuario.find({ $or: [{ dni: { $exists: false } }, { dni: '' }, { dni: null }] });
    report.usuarios.sinDNI = usuariosSinDni.map(u => ({ id: u._id, nombre: `${u.nombre} ${u.apellido}`, email: u.email }));

    // Estudiantes: documentos sin dni
    const estudiantesSinDni = await Estudiante.find({ $or: [{ dni: { $exists: false } }, { dni: '' }, { dni: null }] });
    report.estudiantes.sinDNI = estudiantesSinDni.map(s => ({ id: s._id, nombre: `${s.nombre} ${s.apellido}`, idEstudiante: s.idEstudiante, email: s.email }));

    // Buscar duplicados por dni en cada colección
    const usuariosAgg = await Usuario.aggregate([
      { $match: { dni: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$dni', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    report.usuarios.duplicados = usuariosAgg.map(a => ({ dni: a._id, count: a.count, ids: a.ids }));

    const estudiantesAgg = await Estudiante.aggregate([
      { $match: { dni: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$dni', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);
    report.estudiantes.duplicados = estudiantesAgg.map(a => ({ dni: a._id, count: a.count, ids: a.ids }));

    // Guardar reporte JSON
    const outDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `dni_cleanup_report_${Date.now()}.json`);
    fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
    console.log(`Reporte escrito en: ${outFile}`);

    // Proponer merges automáticos para DNIs duplicados
    // Heurística para elegir 'master' entre ids duplicados:
    // - Preferir documento con la mayor cantidad de campos no nulos/definidos.
    // - Si hay timestamps (createdAt/updatedAt), preferir el más reciente.
    const csvLines = ['collection,dni,masterId,duplicateIds,suggestedAction,notes'];

    const processDuplicates = async (collectionName, agg) => {
      for (const group of agg) {
        const dniVal = group._id;
        const ids = group.ids || [];
        // Cargar los documentos completos para evaluar
        const Model = collectionName === 'usuarios' ? Usuario : Estudiante;
        const docs = await Model.find({ _id: { $in: ids } }).lean();
        // Calcular score por doc: campos no nulos + timestamp (bonus)
        const scoreFor = (doc) => {
          let score = 0;
          for (const k of Object.keys(doc)) {
            if (doc[k] !== null && doc[k] !== '' && doc[k] !== undefined) score += 1;
          }
          if (doc.updatedAt) score += 0.5;
          if (doc.createdAt) score += 0.25;
          return score;
        };
        docs.sort((a, b) => scoreFor(b) - scoreFor(a));
        const master = docs[0];
        const dupIds = docs.slice(1).map(d => d._id.toString()).join('|');
        // Si hay más de un duplicado, proponer merge_keep_master, si no, revisión manual
        const action = dupIds.length > 0 ? 'merge_keep_master' : 'manual_review';
        const notes = `master_score=${scoreFor(master)}; duplicates=${docs.length - 1}`;
        csvLines.push(`${collectionName},${dniVal},${master._id.toString()},${dupIds},${action},"${notes}"`);
      }
    };

    await processDuplicates('usuarios', usuariosAgg);
    await processDuplicates('estudiantes', estudiantesAgg);

    // Guardar CSV de sugerencias
    const csvFile = path.join(outDir, `dni_merge_suggestions_${Date.now()}.csv`);
    fs.writeFileSync(csvFile, csvLines.join('\n'), 'utf8');
    console.log(`CSV de sugerencias escrito en: ${csvFile}`);

    if (fix) {
      console.log('Modo --fix activado: aplicando correcciones no destructivas...');
      // Para documentos sin dni, asignar un placeholder dni migracion: MIGR-<collection>-<id>
      for (const u of usuariosSinDni) {
        const placeholder = `MIGR-USR-${u._id.toString().slice(-6)}`;
        u.dni = placeholder;
        await u.save();
        console.log(`Usuario ${u._id} actualizado con dni placeholder ${placeholder}`);
      }
      for (const s of estudiantesSinDni) {
        const placeholder = `MIGR-EST-${s._id.toString().slice(-6)}`;
        s.dni = placeholder;
        await s.save();
        console.log(`Estudiante ${s._id} actualizado con dni placeholder ${placeholder}`);
      }
      console.log('Correcciones aplicadas. Vuelve a revisar el reporte para confirmar.');
    } else {
      console.log('Modo solo reporte: no se aplicaron cambios. Ejecuta con --fix para aplicar placeholders temporales.');
    }

    await mongoose.connection.close();
    console.log('Conexión cerrada. Proceso finalizado.');
  } catch (err) {
    console.error('Error en migración DNI cleanup:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const fix = args.includes('--fix');
  main({ fix });
}

module.exports = { main };
