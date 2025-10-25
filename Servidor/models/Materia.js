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
    enum: ['CBU', 'Segundo'],
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
    required: false
  },
  division: {
    type: String,
    required: false,
    trim: true
  },
   
  cicloAcademico: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  
  cargaHoraria: {
    horasSemanales: Number,
    horasTotales: Number,
    // horario libre para indicar turno/horario (ej: 'Mañana', 'Tarde', '14:00-16:00')
    horario: {
      type: String,
      required: false,
      trim: true
    }
    ,
    // días de la semana en los que se dicta la materia (ej: ['Lunes','Miércoles'])
    dias: [{ type: String, trim: true }]
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
