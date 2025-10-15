const mongoose = require('mongoose');

const MateriaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  
  codigo: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  institucion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  
  ciclo: {
    type: String,
    enum: ['CBU', 'segundo'],
    required: true,
    trim: true
  },
  especialidad: {
    type: String,
    required: false,
    trim: true
  },
  
  año: {
    type: Number,
    required: true,
    min: 1,
    max: 7
  },
  
  profesor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  
  unidades: [{
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    contenidos: [{
      type: String,
      trim: true
    }],
    orden: {
      type: Number,
      required: true
    },
    fechaInicio: Date,
    fechaFin: Date
  }],
  
  cicloAcademico: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  
  cargaHoraria: {
    horasSemanales: Number,
    horasTotales: Number
  },
  
  activa: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'materias'
});

// Índices
MateriaSchema.index({ ciclo: 1, especialidad: 1, año: 1 });
MateriaSchema.index({ codigo: 1 });

module.exports = mongoose.model('Materia', MateriaSchema);
