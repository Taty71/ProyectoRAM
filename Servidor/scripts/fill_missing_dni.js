const fs = require('fs');
const path = require('path');
const conectarBD = require('../config/database');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');

function normalizeName(s) {
  if (!s) return '';
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  await conectarBD();

  try {
    const query = { $or: [ { dni: { $exists: false } }, { dni: '' } ] };
    const usuarios = await Usuario.find(query).lean();
    console.log(`Usuarios encontrados sin dni: ${usuarios.length}`);

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // backup current usuarios that will be touched
    const backupFile = path.join(backupDir, `usuarios_backup_before_filldni_${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(usuarios, null, 2), 'utf8');
    console.log(`Backup de usuarios escrito en ${backupFile}`);

    const results = [];

    for (const u of usuarios) {
      const out = { userId: u._id.toString(), email: u.email || null, nombre: u.nombre || null, apellido: u.apellido || null, matched: false, matchedBy: null, newDni: null };

      // 1) try match by email
      if (u.email) {
        const estByEmail = await Estudiante.findOne({ email: u.email.toLowerCase() }).lean();
        if (estByEmail && estByEmail.dni) {
          out.matched = true;
          out.matchedBy = 'email';
          out.newDni = estByEmail.dni;
        }
      }

      // 2) try match by normalized name if no email match
      if (!out.matched) {
        const nombreNorm = normalizeName(u.nombre);
        const apellidoNorm = normalizeName(u.apellido);
        if (nombreNorm || apellidoNorm) {
          const estByName = await Estudiante.findOne({
            nombre: new RegExp(`^${nombreNorm.replace(/\s+/g, '\\s+')}$`, 'i'),
            apellido: new RegExp(`^${apellidoNorm.replace(/\s+/g, '\\s+')}$`, 'i')
          }).lean();
          if (estByName && estByName.dni) {
            out.matched = true;
            out.matchedBy = 'nombre+apellido';
            out.newDni = estByName.dni;
          }
        }
      }

      // 3) if matched, update usuario.dni (unless dry-run)
      if (out.matched && out.newDni) {
        try {
          if (!dryRun) {
            await Usuario.updateOne({ _id: u._id }, { $set: { dni: out.newDni } });
          }
        } catch (err) {
          out.error = String(err);
        }
      } else {
        // put placeholder for manual review
        out.matched = false;
        out.matchedBy = 'none';
        out.newDni = `MISSING-${u._id.toString()}`;
        try {
          if (!dryRun) {
            await Usuario.updateOne({ _id: u._id }, { $set: { dni: out.newDni } });
          }
        } catch (err) {
          out.error = String(err);
        }
      }

      results.push(out);
    }

    const reportFile = path.join(backupDir, `fill_missing_dni_report_${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify({ timestamp: new Date().toISOString(), dryRun, results }, null, 2), 'utf8');
    console.log(`Reporte escrito en ${reportFile}`);

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
