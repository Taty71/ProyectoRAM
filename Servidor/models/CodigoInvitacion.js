const mongoose = require('mongoose');

const CodigoInvitacionSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  rol: {
    type: String,
    enum: ['profesor', 'jefe_area', 'estudiante'],
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  apellido: {
    type: String,
    required: true
  },
  institucion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  usado: {
    type: Boolean,
    default: false
  },
  fechaExpiracion: {
    type: Date
  },
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CodigoInvitacion', CodigoInvitacionSchema);
