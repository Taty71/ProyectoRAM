const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');

mongoose.connect('mongodb://localhost:27017/ram_db');

async function actualizarUsuarios() {
  const usuarios = await Usuario.find();
  for (const user of usuarios) {
    if (!user.especialidades) user.especialidades = [];
    // Puedes agregar otros campos aquí si el modelo cambió
    await user.save();
  }
  console.log("Usuarios actualizados");
  mongoose.disconnect();
}

actualizarUsuarios();
