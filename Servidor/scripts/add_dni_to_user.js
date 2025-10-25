const conectarBD = require('../config/database');
const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Solicitud = require('../models/SolicitudCodigo');
const fs = require('fs');
const path = require('path');

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const apply = args.includes('--apply');

  const userIdArg = args.find(a => a.startsWith('--userId='));
  const emailArg = args.find(a => a.startsWith('--email='));
  const dniArg = args.find(a => a.startsWith('--dni='));

  if (!dniArg) {
    console.error('Usage: node add_dni_to_user.js --dni=12345678 (--userId=<id> | --email=<email>) [--dry-run | --apply]');
    process.exit(1);
  }

  const dni = dniArg.split('=')[1];
  if (!dni) {
    console.error('Invalid --dni value');
    process.exit(1);
  }

  let userQuery = null;
  if (userIdArg) userQuery = { _id: userIdArg.split('=')[1] };
  if (emailArg) userQuery = { email: emailArg.split('=')[1].toLowerCase() };
  if (!userQuery) {
    console.error('Provide --userId or --email to identify the user');
    process.exit(1);
  }

  await conectarBD();

  try {
    const user = await Usuario.findOne(userQuery).lean();
    if (!user) {
      console.error('User not found for query', userQuery);
      await mongoose.connection.close();
      process.exit(2);
    }

    console.log('Found user:', user._id.toString(), user.email, 'current dni:', user.dni || '<none>');

    // Check for conflicts: another user with same dni
    const conflict = await Usuario.findOne({ dni: dni, _id: { $ne: user._id } }).lean();
    if (conflict) {
      console.error('Conflict: another user already has dni', dni, 'user:', conflict._id.toString(), conflict.email);
      await mongoose.connection.close();
      process.exit(3);
    }

    // Preview changes
    const changes = [];
    changes.push({ model: 'Usuario', id: user._id.toString(), field: 'dni', from: user.dni || null, to: dni });

    // Denormalized updates: SolicitudCodigo documents with this email should get dni
    const solicitudes = await Solicitud.find({ email: user.email }).lean();
    solicitudes.forEach(s => changes.push({ model: 'SolicitudCodigo', id: s._id.toString(), field: 'dni', from: s.dni || null, to: dni }));

    // If there is an Estudiante doc that matches this user (by email), update it too
    const estudiante = await Estudiante.findOne({ email: user.email }).lean();
    if (estudiante) changes.push({ model: 'Estudiante', id: estudiante._id.toString(), field: 'dni', from: estudiante.dni || null, to: dni });

    console.log('Planned changes:');
    changes.forEach(c => console.log(JSON.stringify(c)));

    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    const report = { timestamp: new Date().toISOString(), dryRun, apply, userQuery, dni, changes };
    const reportFile = path.join(backupDir, `add_dni_report_${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');
    console.log('Report written to', reportFile);

    if (dryRun || !apply) {
      console.log('Dry-run mode; no changes applied. To apply run with --apply');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Apply updates
    const updateResults = [];
    const uRes = await Usuario.updateOne({ _id: user._id }, { $set: { dni } });
    updateResults.push({ model: 'Usuario', result: uRes });

    if (solicitudes.length) {
      const sRes = await Solicitud.updateMany({ email: user.email }, { $set: { dni } });
      updateResults.push({ model: 'SolicitudCodigo', result: sRes });
    }

    if (estudiante) {
      const eRes = await Estudiante.updateOne({ _id: estudiante._id }, { $set: { dni } });
      updateResults.push({ model: 'Estudiante', result: eRes });
    }

    // write applied report
    const appliedFile = path.join(backupDir, `add_dni_applied_${Date.now()}.json`);
    fs.writeFileSync(appliedFile, JSON.stringify({ timestamp: new Date().toISOString(), updateResults }, null, 2), 'utf8');
    console.log('Applied changes report written to', appliedFile);

    await mongoose.connection.close();
    console.log('Done.');
    process.exit(0);

  } catch (err) {
    console.error('Error:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

if (require.main === module) main();

module.exports = { main };
