const mongoose = require('mongoose');

const TrabajoSchema = new mongoose.Schema({
  titulo: { type: String, required: true, trim: true },
  descripcion: { type: String, trim: true },
  profesor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  materia: { type: mongoose.Schema.Types.ObjectId, ref: 'Materia', required: true },
  materiaCodigo: { type: String, trim: true },
  ciclo: { type: String, enum: ['CBU', 'segundo'], required: true },
  especialidad: { type: String, trim: true },
  curso: { type: Number, min: 1, max: 7, required: true },
  division: { type: String, trim: true },
  temasAprendizaje: [{ type: String, trim: true }],
  fechaCreacion: { type: Date, default: () => new Date() },
  activo: { type: Boolean, default: true }
}, { timestamps: true, collection: 'trabajospracticos' });

TrabajoSchema.index({ profesor: 1, materia: 1, curso: 1 });

module.exports = mongoose.model('TrabajoPractico', TrabajoSchema);
