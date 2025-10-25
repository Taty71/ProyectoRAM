const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const conectarBD = require('./config/database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Conectar a la base de datos
conectarBD();

// Middleware de seguridad
app.use(helmet());

// Rate limiting para prevenir abuso
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por ventana de tiempo
  message: 'Demasiadas solicitudes desde esta IP, intente de nuevo más tarde.'
});
app.use(limiter);

// Middleware de logging
app.use(morgan('combined'));

// Configuración de CORS más robusta para desarrollo
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (Postman, curl, servidores sin navegador)
    if (!origin) return callback(null, true);

    try {
      const parsed = new URL(origin);
      const host = parsed.hostname; // hostname sin puerto ni esquema

      // Permitir localhost (IPv4 y IPv6) y 127.0.0.1
      if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
        return callback(null, true);
      }

      // Permitir explícitamente en desarrollo cualquier origen que incluya 'localhost'
      if (origin.includes('localhost')) return callback(null, true);

      // Por defecto, bloquear otros orígenes en este entorno
      return callback(new Error('Not allowed by CORS'));
    } catch (err) {
      // Si la URL no pudo parsearse, rechazar por seguridad
      return callback(new Error('Not allowed by CORS'));
    }
  },
  // Permitir credenciales y cabeceras comunes de API (incluye Authorization para tokens)
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
};

app.use(cors(corsOptions));
// Asegurar que las peticiones preflight (OPTIONS) reciban respuesta CORS
app.options('*', cors(corsOptions));

// Fallback: en desarrollo, si por alguna razón falta el header, añádelo
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    // Si ya existe, no lo sobrescribimos
    if (!res.getHeader('Access-Control-Allow-Origin')) {
      res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    // Si es preflight, responder 204 inmediatamente
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });
}
// Middleware para parsing de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rutas principales para R.A.M.
app.use('/api/setup', require('./routes/setup'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/escuela', require('./routes/escuela'));
app.use('/api/evaluaciones', require('./routes/evaluaciones'));
app.use('/api/estudiantes', require('./routes/estudiantes'));
app.use('/api/materias', require('./routes/materias'));
app.use('/api', require('./routes/assignmentRequests'));
app.use('/api/trabajos', require('./routes/trabajos'));
app.use('/api/reportes', require('./routes/reportes'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/instituciones', require('./routes/instituciones'));

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    mensaje: 'Servidor R.A.M. (Reforzar, Aprender, Mejorar)',
    version: '1.0.0',
    descripcion: 'API Backend para herramienta de autoevaluación estudiantil',
    endpoints: [
      '/api/auth - Autenticación de usuarios y estudiantes',
      '/api/escuela - Información de estructura CBU + Especialidades',
      '/api/evaluaciones - Gestión de autoevaluaciones',
      '/api/estudiantes - Gestión de estudiantes',
      '/api/usuarios - Gestión de usuarios del sistema',
      '/api/materias - Gestión de materias y contenidos',
      '/api/trabajos - Trabajos prácticos evaluativos (profesores)',
      '/api/reportes - Generación de reportes y análisis',
      '/api/dashboard - Panel de control para educadores'
    ]
  });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Error interno del servidor',
    mensaje: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal'
  });
});

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    mensaje: `La ruta ${req.originalUrl} no existe en este servidor`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor R.A.M. ejecutándose en puerto ${PORT}`);
  console.log(`📚 Aplicación de autoevaluación estudiantil activa`);
  console.log(`🌐 Acceso: http://localhost:${PORT}`);
});

module.exports = app;
