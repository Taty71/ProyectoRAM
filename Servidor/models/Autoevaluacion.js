const mongoose = require('mongoose');

const AutoevaluacionSchema = new mongoose.Schema({
  // Referencia al estudiante (ya no anónima)
  estudiante: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estudiante',
    required: true
  },
  
  // Información de la evaluación
  materia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Materia',
    required: true
  },
  
  institucion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institucion',
    required: true
  },
  
  unidad: {
    type: String,
    required: true,
    trim: true
  },
  
  contenidos: [{
    type: String,
    trim: true
  }],
  
  // Autoevaluación con emoticones (1-5)
  comprensionGeneral: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  conocimientoPrevio: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  dificultadPercibida: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  confianzaRespuestas: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  
  // Reflexión cualitativa
  reflexiones: {
    masFactil: {
      type: String,
      maxlength: 500,
      trim: true
    },
    masDificil: {
      type: String,
      maxlength: 500,
      trim: true
    },
    aprendizajes: {
      type: String,
      maxlength: 500,
      trim: true
    },
    mejorasPersonales: {
      type: String,
      maxlength: 500,
      trim: true
    }
  },
  
  // Estrategias de estudio utilizadas
  estrategiasEstudio: [{
    type: String,
    enum: [
      'Lectura individual',
      'Resúmenes',
      'Mapas conceptuales',
      'Práctica con ejercicios',
      'Estudio grupal',
      'Videos explicativos',
      'Consulta docente',
      'Investigación adicional',
      'Repaso de apuntes',
      'Otra'
    ]
  }],
  
  // Tiempo de estudio estimado (en horas)
  tiempoEstudio: {
    type: Number,
    min: 0,
    max: 50
  },
  
  // Metadata
  fechaEvaluacion: {
    type: Date,
    required: true
  },
  
  fechaAutoevaluacion: {
    type: Date,
    default: Date.now
  },
  
  // Para análisis estadístico
  especialidad: {
    type: String,
    trim: true
  },
  
  año: {
    type: Number,
    min: 1,
    max: 7
  },
  
  cicloAcademico: {
    type: Number,
    required: true,
    default: () => new Date().getFullYear()
  }
}, {
  timestamps: true,
  collection: 'autoevaluaciones'
});

// Índices para optimizar consultas
AutoevaluacionSchema.index({ estudiante: 1, materia: 1 });
AutoevaluacionSchema.index({ institucion: 1, cicloAcademico: 1 });
AutoevaluacionSchema.index({ fechaEvaluacion: -1 });
AutoevaluacionSchema.index({ especialidad: 1, año: 1 });

module.exports = mongoose.model('Autoevaluacion', AutoevaluacionSchema);
