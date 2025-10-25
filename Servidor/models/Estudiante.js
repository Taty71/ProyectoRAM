const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const EstudianteSchema = new mongoose.Schema({
  idEstudiante: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  
  apellido: {
    type: String,
    required: true,
    trim: true
  },
  
  dni: {
    type: String,
    required: true,
    trim: true
  },
  
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  institucion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
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
  
  division: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  
  cicloAcademico: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  },
  
  fechaNacimiento: {
    type: Date,
    required: true
  },
  
  estadoAcademico: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  
  fechaIngreso: {
    type: Date,
    required: true
  },
  
  ultimoAcceso: {
    type: Date,
    default: Date.now
  },
  
  configuracion: {
    recibirNotificaciones: {
      type: Boolean,
      default: true
    },
    compartirDatosConDocentes: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  collection: 'estudiantes'
});

// Middleware para hashear password
EstudianteSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar passwords
EstudianteSchema.methods.compararPassword = async function(passwordCandidata) {
  return await bcrypt.compare(passwordCandidata, this.password);
};

// Virtual para nombre completo
EstudianteSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

// Virtual para verificar si está en el ciclo actual
EstudianteSchema.virtual('enCicloActual').get(function() {
  return this.cicloAcademico === new Date().getFullYear() && this.estadoAcademico === 'activo';
});

// Índices
EstudianteSchema.index({ institucion: 1, especialidad: 1, año: 1 });
EstudianteSchema.index({ cicloAcademico: 1, estadoAcademico: 1 });
// Asegurar unicidad por idEstudiante y por dni a nivel de índice (dni es la clave única del sistema)
EstudianteSchema.index({ idEstudiante: 1 }, { unique: true });
EstudianteSchema.index({ dni: 1 }, { unique: true });

module.exports = mongoose.model('Estudiante', EstudianteSchema);
