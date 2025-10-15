const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
require('dotenv').config();

async function resetearPasswordAdmin() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/registroRAM');
    console.log('✅ Conectado a MongoDB');

    // Buscar el usuario administrador
    const admin = await Usuario.findOne({ email: 'crisbmaia50@gmail.com' });
    
    if (!admin) {
      console.log('❌ No se encontró el usuario crisbmaia50@gmail.com');
      return;
    }

    console.log('📄 Usuario encontrado:');
    console.log('   Email:', admin.email);
    console.log('   Nombre:', admin.nombre, admin.apellido);
    console.log('   Rol:', admin.rol);
    console.log('   Activo:', admin.activo);

    // Cambiar la contraseña a 'admin50'
    admin.password = 'admin50';
    await admin.save();

    console.log('');
    console.log('🔑 Contraseña actualizada exitosamente');
    console.log('📧 Email: crisbmaia50@gmail.com');
    console.log('🔑 Nueva contraseña: admin50');
    console.log('');
    console.log('✅ Ahora puedes hacer login con estas credenciales');

  } catch (error) {
    console.error('❌ Error al resetear password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

resetearPasswordAdmin();