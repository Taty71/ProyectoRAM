const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Usuario = require('../models/Usuario');
const Institucion = require('../models/Institucion');

// Verificar si el sistema necesita configuración inicial
router.get('/verificar', async (req, res) => {
  try {
    console.log('=== VERIFICACION SETUP ===');
    
    // Verificar instituciones
    let institucionCount = 0;
    let adminCount = 0;
    
    try {
      // Intentar buscar instituciones con diferentes métodos
      const todasInstituciones = await Institucion.find({}).lean();
      const institucionesActivas = await Institucion.find({ activa: true }).lean();
      
      console.log('Total instituciones:', todasInstituciones.length);
      console.log('Instituciones activas:', institucionesActivas.length);
      
      // Si hay instituciones, usar las activas; si no hay activas pero hay instituciones, asumir que están activas
      institucionCount = institucionesActivas.length > 0 ? institucionesActivas.length : 
                       (todasInstituciones.length > 0 ? todasInstituciones.length : 0);
                       
      // Log de debug
      if (todasInstituciones.length > 0) {
        console.log('Primera institución encontrada:', {
          nombre: todasInstituciones[0].nombre,
          activa: todasInstituciones[0].activa,
          codigo: todasInstituciones[0].codigo
        });
      }
      
    } catch (instError) {
      console.error('Error buscando instituciones:', instError);
      institucionCount = 0;
    }
    
    try {
      // Verificar administradores
      const todosAdmins = await Usuario.find({ rol: 'administrador' }).lean();
      const adminsActivos = await Usuario.find({ rol: 'administrador', activo: true }).lean();
      
      console.log('Total administradores:', todosAdmins.length);
      console.log('Administradores activos:', adminsActivos.length);
      
      // Similar lógica para administradores
      adminCount = adminsActivos.length > 0 ? adminsActivos.length : 
                  (todosAdmins.length > 0 ? todosAdmins.length : 0);
                  
    } catch (adminError) {
      console.error('Error buscando administradores:', adminError);
      adminCount = 0;
    }
    
    // Determinar si necesita setup
    const necesitaSetup = institucionCount === 0 || adminCount === 0;
    
    console.log('=== RESULTADO ===');
    console.log('Instituciones válidas:', institucionCount);
    console.log('Administradores válidos:', adminCount);
    console.log('¿Necesita setup?:', necesitaSetup);
    
    res.json({
      necesitaSetup,
      mensaje: necesitaSetup 
        ? 'El sistema requiere configuración inicial' 
        : 'El sistema ya está configurado',
      debug: {
        instituciones: institucionCount,
        administradores: adminCount
      }
    });
    
  } catch (error) {
    console.error('Error general en verificación setup:', error);
    
    // En caso de error, asumir que NO necesita setup si hay datos en la BD
    // Esto evita que se muestre el setup cuando ya hay datos
    res.json({
      necesitaSetup: false,
      mensaje: 'Sistema asumido como configurado (error en verificación)',
      debug: {
        error: error.message,
        instituciones: 'desconocido',
        administradores: 'desconocido'
      }
    });
  }
});

// Crear institución (paso 1 del setup)
router.post('/institucion', [
  body('nombre').notEmpty().trim().withMessage('El nombre es requerido'),
  body('codigo').notEmpty().trim().withMessage('El código es requerido'),
  body('ciclos').isArray({ min: 1 }).withMessage('Debe cargar al menos una especialidad u orientación'),
  body('modalidad').notEmpty().trim().withMessage('La modalidad es requerida'),
  body('contacto.email').notEmpty().isEmail().withMessage('Email inválido'),
  body('contacto.sitioWeb').optional().isURL().withMessage('URL inválida')
], async (req, res) => {
  try {
    // Verificar que el sistema no esté ya configurado
    const institucionExistente = await Institucion.countDocuments({ activa: true });
    if (institucionExistente > 0) {
      return res.status(400).json({
        error: 'El sistema ya tiene una institución configurada'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errors.array()
      });
    }

    const {
      nombre,
      codigo,
      ciclos,
      modalidad,
      contacto
    } = req.body;

    // Verificar que el código no exista
    const codigoExistente = await Institucion.findOne({ codigo });
    if (codigoExistente) {
      return res.status(400).json({
        error: 'Ya existe una institución con ese código'
      });
    }


    const nuevaInstitucion = new Institucion({
      nombre,
      codigo,
      modalidad,
      ciclos,
      contacto,
      activa: true
    });

    await nuevaInstitucion.save();

    res.status(201).json({
      mensaje: 'Institución creada exitosamente',
      institucion: {
        id: nuevaInstitucion._id,
        nombre: nuevaInstitucion.nombre,
        codigo: nuevaInstitucion.codigo,
        ciclos: nuevaInstitucion.ciclos
      }
    });

  } catch (error) {
    console.error('Error creando institución:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Ya existe una institución con ese código'
      });
    }
    
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Crear administrador (paso 2 del setup)
router.post('/administrador', [
  body('nombre').notEmpty().trim().withMessage('El nombre es requerido'),
  body('apellido').notEmpty().trim().withMessage('El apellido es requerido'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
  body('dni').notEmpty().trim().withMessage('El DNI es requerido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
  try {
    // Verificar que exista una institución
    const institucion = await Institucion.findOne({ activa: true });
    if (!institucion) {
      return res.status(400).json({
        error: 'Debe crear una institución antes de crear el administrador'
      });
    }

    // Verificar que no exista ya un administrador
    const adminExistente = await Usuario.countDocuments({ rol: 'administrador', activo: true });
    if (adminExistente > 0) {
      return res.status(400).json({
        error: 'Ya existe un administrador en el sistema'
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Datos inválidos',
        detalles: errors.array()
      });
    }

    const {
      nombre,
      apellido,
      email,
      dni,
      password
    } = req.body;

    // Verificar que el email no exista
    const emailExistente = await Usuario.findOne({ email });
    if (emailExistente) {
      return res.status(400).json({
        error: 'Ya existe un usuario con ese email'
      });
    }

    // Verificar que el DNI no exista
    const dniExistente = await Usuario.findOne({ dni });
    if (dniExistente) {
      return res.status(400).json({
        error: 'Ya existe un usuario con ese DNI'
      });
    }

    const nuevoAdmin = new Usuario({
      nombre,
      apellido,
      email,
      dni,
      password,
      rol: 'administrador',
      institucion: institucion._id,
      activo: true,
      permisos: {
        verReportes: true,
        gestionarUsuarios: true,
        exportarDatos: true
      }
    });

    await nuevoAdmin.save();

    res.status(201).json({
      mensaje: 'Administrador creado exitosamente. Sistema configurado',
      administrador: {
        id: nuevoAdmin._id,
        nombre: nuevoAdmin.nombre,
        apellido: nuevoAdmin.apellido,
        email: nuevoAdmin.email,
        rol: nuevoAdmin.rol
      }
    });

  } catch (error) {
    console.error('Error creando administrador:', error);
    
    if (error.code === 11000) {
      if (error.keyPattern.email) {
        return res.status(400).json({
          error: 'Ya existe un usuario con ese email'
        });
      }
      if (error.keyPattern.dni) {
        return res.status(400).json({
          error: 'Ya existe un usuario con ese DNI'
        });
      }
    }
    
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;