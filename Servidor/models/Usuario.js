const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  ciclo: {
    type: String,
    enum: ['cbu', 'segundo'],
    required: false
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  rol: {
    type: String,
    enum: ['administrador', 'profesor', 'jefe_area'],
    required: true
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
    unique: true,
    trim: true
  },
  
  institucion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  
  especialidades: [{
    type: String,
    trim: true
  }],
  
  materias: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia'
  }],
  
  cursosACargo: [{
    especialidad: {
      type: String,
      enum: ['CBU', 'Electricidad', 'Programación'],
      required: true
    },
    cursos: [{
      curso: {
        type: Number,
        required: true
      },
      division: {
        type: String,
        required: true
      }
    }],
    cicloAcademico: {
      type: Number,
      required: true
    }
    }],
  
  permisos: {
    verReportes: {
      type: Boolean,
      default: function() {
        return this.rol === 'administrador' || this.rol === 'jefe_area';
      }
    },
    gestionarUsuarios: {
      type: Boolean,
      default: function() {
        return this.rol === 'administrador';
      }
    },
    exportarDatos: {
      type: Boolean,
      default: function() {
        return this.rol === 'administrador' || this.rol === 'jefe_area';
      }
    }
  },
  
  activo: {
    type: Boolean,
    default: true
  },
  
  fechaIngreso: {
    type: Date,
    default: Date.now
  },
  
  ultimoAcceso: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'usuarios'
});

// Middleware para hashear password antes de guardar
UsuarioSchema.pre('save', async function(next) {
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
UsuarioSchema.methods.compararPassword = async function(passwordCandidata) {
  return await bcrypt.compare(passwordCandidata, this.password);
};


// Virtual para nombre completo
UsuarioSchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellido}`;
});

module.exports = mongoose.model('Usuario', UsuarioSchema);
