#!/usr/bin/env node

/**
 * normalizar_materias.js
 * Script para normalizar documentos en la colección `materias`.
 * - hace backup de los documentos que se van a modificar (JSON timestamps)
 * - corrige profesor: "" -> null
 * - convierte año a Number si viene como string
 * - añade division por defecto si falta (A para años 1-3, A para 4-7 por defecto)
 *
 * Uso:
 *  node normalizar_materias.js [--dry-run] [--limit=N]
 *
 * IMPORTANTE: ejecutar con precaución. El script crea un archivo de respaldo
 * en la misma carpeta `./backups/materias-backup-<timestamp>.json`.
 */

const path = require('path');
const fs = require('fs');
const conectarBD = require('../config/database');
const mongoose = require('mongoose');
const Materia = require('../models/Materia');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : null;

  console.log('=== normalizar_materias ===');
  console.log('dryRun:', dryRun, 'limit:', limit || 'no limit');

  await conectarBD();

  try {
    // Find candidate materias: those with obvious legacy shapes
    // Use raw collection cursor to avoid Mongoose casting (e.g. profesor: "" casting to ObjectId)
    const query = {
      $or: [
        { profesor: '' },
        { division: { $exists: false } },
        { año: { $type: 'string' } }
      ]
    };

    const col = mongoose.connection.db.collection('materias');
    let cursor = col.find(query);
    if (limit) cursor = cursor.limit(limit);

    const changes = [];
    for await (const m of cursor) {
      // If cursor yields a Mongoose document, use toObject(); otherwise use raw doc
      const original = (typeof m.toObject === 'function') ? m.toObject({ depopulate: true }) : m;
      const update = {};
      let needsUpdate = false;

      // profesor: "" -> null
      if (original.profesor === '') {
        update.profesor = null;
        needsUpdate = true;
      }

      // año: string -> number
      if (typeof original.año === 'string') {
        const n = parseInt(original.año, 10);
        if (!Number.isNaN(n)) {
          update.año = n;
          needsUpdate = true;
        }
      }

      // division: if missing -> default based on año
      if (original.division === undefined || original.division === null || original.division === '') {
        const añoNum = typeof original.año === 'number' ? original.año : (update.año || (typeof original.año === 'string' ? parseInt(original.año, 10) : null));
        let def = 'A';
        if (Number.isInteger(añoNum)) {
          if (añoNum >= 1 && añoNum <= 3) def = 'A';
          else if (añoNum >= 4 && añoNum <= 7) def = 'A';
        }
        update.division = def;
        needsUpdate = true;
      }

      // ensure ciclo is one of allowed values - if invalid, log and skip
      if (original.ciclo && !['CBU', 'segundo'].includes(original.ciclo)) {
        console.warn(`Materia ${original._id} ciclo inesperado: ${original.ciclo} — no se modifica ciclo`);
      }

      if (needsUpdate) {
        changes.push({ id: original._id, original, update });
      }
    }

    if (changes.length === 0) {
      console.log('No se encontraron documentos que requieran normalización.');
      process.exit(0);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupsDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
    const backupPath = path.join(backupsDir, `materias-backup-${timestamp}.json`);

    fs.writeFileSync(backupPath, JSON.stringify(changes.map(c => ({ id: c.id, original: c.original })), null, 2), 'utf8');
    console.log(`Backup creado: ${backupPath} (contiene ${changes.length} documentos)`);

    if (dryRun) {
      console.log('Dry-run activado — no se realizarán cambios. Resumen de cambios planeados:');
      changes.slice(0, 50).forEach(c => console.log(`- ${c.id}: ${JSON.stringify(c.update)}`));
      console.log('Fin dry-run. Para aplicar cambios, ejecute sin --dry-run');
      process.exit(0);
    }

    console.log(`Aplicando ${changes.length} actualizaciones...`);
    const results = [];
    for (const c of changes) {
      try {
        // use findByIdAndUpdate with runValidators:false to avoid Legacy-schema validation failures
        const res = await Materia.findByIdAndUpdate(c.id, { $set: c.update }, { new: true, runValidators: false });
        results.push({ id: c.id, ok: !!res });
      } catch (err) {
        console.error(`Error al actualizar ${c.id}:`, err.message || err);
        results.push({ id: c.id, ok: false, error: err.message || String(err) });
      }
    }

    const applied = results.filter(r => r.ok).length;
    console.log(`Actualizaciones aplicadas: ${applied}/${results.length}`);
    console.log(`Detalles guardados en backup antes de cambios: ${backupPath}`);

    process.exit(0);
  } catch (err) {
    console.error('Error en la normalización:', err);
    process.exit(1);
  }
}

main();
