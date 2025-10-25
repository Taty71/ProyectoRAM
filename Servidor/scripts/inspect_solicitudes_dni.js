const mongoose = require('mongoose');
const conectarBD = require('../config/database');

(async function(){
  await conectarBD();
  const Solicitud = require('../models/SolicitudCodigo');
  const docs = await Solicitud.find({}).limit(50).lean();
  console.log(`Found ${docs.length} solicitudes`);
  docs.forEach(d=>{
    console.log(d._id, 'dni:', d.dni, 'email:', d.email, 'institucionNombre:', d.institucionNombre);
  });
  process.exit(0);
})();
