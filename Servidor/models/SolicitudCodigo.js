const mongoose = require('mongoose');
const SolicitudCodigoSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true },
  dni: { type: String },
  rol: { type: String, required: true },
  // motivo eliminado
  institucion: { type: mongoose.Schema.Types.ObjectId, ref: 'Institucion' },
  institucionNombre: { type: String },
  fecha: { type: Date, default: Date.now },
  estado: { type: String, enum: ['pendiente', 'atendida'], default: 'pendiente' }
});
module.exports = mongoose.model('SolicitudCodigo', SolicitudCodigoSchema);