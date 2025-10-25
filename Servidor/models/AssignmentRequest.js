const mongoose = require('mongoose');

const AssignmentRequestSchema = new mongoose.Schema({
  materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia', required: true },
  profesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  requestedAt: { type: Date, default: Date.now },
  horarioPropuesto: { type: String, trim: true },
  cargaHorariaPropuesta: {
    horasSemanales: Number,
    horasTotales: Number
  },
  // Días propuestos para la materia (ej: ['Lunes','Martes'])
  diasPropuestos: [{ type: String, trim: true }],
  estado: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  adminComentario: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('AssignmentRequest', AssignmentRequestSchema);
