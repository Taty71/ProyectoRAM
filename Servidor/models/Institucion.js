const mongoose = require('mongoose');

const InstitucionSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  codigo: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    uppercase: true
  },
  modalidad: {
    type: String,
    enum: ['tecnica', 'orientada'],
    required: true
  },
  ciclos: [{
    id: {
      type: String,
      required: true
    },
    nombre: {
      type: String,
      required: true
    },
    cursos: [{
      type: String,
      enum: ['1ro', '2do', '3ro', '4to', '5to', '6to', '7mo'],
      required: true
    }]
  }],
  contacto: {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    sitioWeb: {
      type: String,
      trim: true
    }
  },
  activa: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true,
  collection: 'institucion'
});

// Índices
InstitucionSchema.index({ codigo: 1 });

module.exports = mongoose.model('Institucion', InstitucionSchema);
