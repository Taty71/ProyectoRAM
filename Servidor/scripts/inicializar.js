const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Institucion = require('../models/Institucion');
require('dotenv').config();

async function inicializarSistema() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ram_db');
    console.log('✅ Conectado a MongoDB');

  // Eliminar cualquier usuario administrador existente para evitar duplicados y problemas de hash
  await Usuario.deleteMany({ rol: 'administrador' });
  console.log('🗑️ Usuarios administrador eliminados (si existían)');

  // Eliminar todas las instituciones
  const Institucion = require('../models/Institucion');
  await Institucion.deleteMany({});
  console.log('🗑️ Instituciones eliminadas (si existían)');

  // Eliminar todos los estudiantes
  const Estudiante = require('../models/Estudiante');
  await Estudiante.deleteMany({});
  console.log('🗑️ Estudiantes eliminados (si existían)');

    // Verificar si ya existe la institución
    let institucionPorDefecto = await Institucion.findOne({ codigo: 'ETP001' });
    
    if (!institucionPorDefecto) {
      // Crear institución por defecto
      institucionPorDefecto = new Institucion({
        nombre: 'Instituto Provincial Educación Técnico',

        codigo: 'IPET379',
        direccion: {
          calle: 'Avellaneda 685',
          ciudad: 'La Calera',
          provincia: 'Provincia Ejemplo',
          codigoPostal: '5151'
        },
        contacto: {
          telefono: '+54 03543-5678',
          email: 'contacto@institutoprovincial.edu.ar',
          sitioWeb: 'www.institutoprovincial.edu.ar'
        },
        configuracion: {
          especialidades: ['cbu', 'electricidad', 'programacion']
        }
      });

      await institucionPorDefecto.save();
      console.log('🏫 Institución por defecto creada');
    } else {
      console.log('🏫 Institución ya existe');
    }

    // Crear usuario administrador por defecto
    const adminPorDefecto = new Usuario({
      email: 'crisbmaia50@gmail.com',
      password: 'admin379',
      nombre: 'Administrador',
      apellido: 'Sistema',
      dni: '12345678',
      rol: 'administrador',
      institucion: institucionPorDefecto._id
    });

    await adminPorDefecto.save();

    console.log('🎉 Sistema R.A.M. inicializado correctamente');
    console.log('');
    console.log('📋 CREDENCIALES DEL ADMINISTRADOR:');
    console.log('📧 Email: crisbmaia50@gmail.com');
    console.log('🔑 Contraseña: admin379');
    console.log('');
    console.log('⚠️  IMPORTANTE: Cambiar estas credenciales en el primer login');
    console.log('');
    console.log('🎓 Estructura Educativa Configurada:');
    console.log('   📚 CBU (Ciclo Básico Unificado): 1°, 2°, 3°');
    console.log('   ⚡ Técnico en Electricidad: 4°, 5°, 6°');
    console.log('   💻 Técnico en Programación: 4°, 5°, 6°');
    console.log('');
    console.log('📝 Próximos pasos:');
    console.log('1. Iniciar el servidor: npm run dev');
    console.log('2. Hacer login con las credenciales proporcionadas');
    console.log('3. Cambiar la contraseña del administrador');
    console.log('4. Configurar los datos de la escuela');
    console.log('5. Registrar profesores, jefes de área y estudiantes');

  } catch (error) {
    console.error('❌ Error al inicializar el sistema:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

// Ejecutar solo si este archivo es llamado directamente
if (require.main === module) {
  inicializarSistema();
}

module.exports = { inicializarSistema };
