const mongoose = require('mongoose');
const Institucion = require('../models/Institucion');

mongoose.connect('mongodb://localhost:27017/ram_db');

async function actualizarInstituciones() {
  const instituciones = await Institucion.find();
  for (const inst of instituciones) {
    if (!inst.ciclos || inst.ciclos.length === 0) {
      inst.ciclos = [
        {
          nombre: "Ciclo Básico Unificado",
          codigo: "CBU",
          especialidades: [
            { nombre: "Ciclo Básico Unificado", codigo: "CBU" }
          ]
        },
        {
          nombre: "Segundo ciclo",
          codigo: "segundo",
          especialidades: [
            { nombre: "Electricidad", codigo: "Elec01" },
            { nombre: "Programación", codigo: "Prog02" }
          ]
        }
      ];
    }
    await inst.save();
  }
  console.log("Instituciones actualizadas");
  mongoose.disconnect();
}

actualizarInstituciones();
