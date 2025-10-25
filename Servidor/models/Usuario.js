const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UsuarioSchema = new mongoose.Schema({
  ciclo: {
    type: String,
    enum: ['primer:cbu', 'segundo'],
    required: false
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
  
  rol: {
    type: String,
    enum: ['administrador', 'profesor', 'jefe_area', 'estudiante'],
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
    required: true, // allow missing DNI while we backfill existing users
    trim: true
  },
  
  institucion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  institucionNombre: {
    type: String,
    required: true,
    trim: true
  },
  
  especialidades: [{
    type: String,
    trim: true
  }],
  
  // Campos específicos para estudiantes
  anio: {
    type: Number,
    required: false
  },
  division: {
    type: String,
    required: false
  },
  fechaNacimiento: {
    type: Date,
    required: false
  },
  
  // Note: `materias` and `cursosACargo` were removed because those
  // relationships are managed in separate collections when assigning
  // materias/cursos to users. Keep student-specific fields above.
  
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

// NOTE: previously the code created a unique index on `dni`.
// Keep schema-level definition here but do NOT create the unique index automatically
// because the database currently contains users without dni and indexes must be
// created after data cleanup. To add a unique index later run a maintenance script
// once all users have valid, unique DNIs.

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
