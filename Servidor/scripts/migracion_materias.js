const mongoose = require('mongoose');
const Materia = require('../models/Materia');
const Institucion = require('../models/Institucion');

mongoose.connect('mongodb://localhost:27017/ram_db');

async function actualizarMaterias() {
  const materias = await Materia.find();
  for (const mat of materias) {
    // Buscar la institución asociada
    const inst = await Institucion.findById(mat.institucion);
    if (!inst) continue;

    // Determinar ciclo válido
    let cicloValido = null;
    if (mat.especialidad === 'CBU' || !mat.especialidad) {
      cicloValido = 'CBU';
    } else {
      // Buscar si la especialidad está en el segundo ciclo
      const segundoCiclo = inst.ciclos && inst.ciclos.find(c => c.codigo === 'segundo');
      if (segundoCiclo && segundoCiclo.especialidades.some(e => e.nombre === mat.especialidad || e.codigo === mat.especialidad)) {
        cicloValido = 'segundo';
      }
    }
    if (cicloValido) {
      mat.ciclo = cicloValido;
    }
    // Si falta especialidad y el ciclo es segundo, intentar asignar
    if (!mat.especialidad && cicloValido === 'segundo') {
      // Si hay solo una especialidad en segundo ciclo, asignar esa
      const segundoCiclo = inst.ciclos.find(c => c.codigo === 'segundo');
      if (segundoCiclo && segundoCiclo.especialidades.length === 1) {
        mat.especialidad = segundoCiclo.especialidades[0].codigo;
      }
    }
    await mat.save();
  }
  console.log('Materias actualizadas');
  mongoose.disconnect();
}

actualizarMaterias();
