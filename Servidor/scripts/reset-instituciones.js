const mongoose = require('mongoose');
require('dotenv').config();

async function resetInstituciones() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ram_system');
    
    console.log('Conectado a MongoDB');
    
    // Eliminar la colección de instituciones
    const result = await mongoose.connection.db.collection('instituciones').drop();
    
    console.log('✅ Colección "instituciones" eliminada exitosamente');
    console.log('ℹ️  Resultado:', result);
    
    // Verificar que no existan instituciones
    const count = await mongoose.connection.db.collection('instituciones').countDocuments();
    console.log(`📊 Instituciones restantes: ${count}`);
    
    console.log('\n🎯 Pasos siguientes:');
    console.log('1. Inicia el servidor: npm run dev');
    console.log('2. Abre la aplicación en el navegador');
    console.log('3. Deberías ver el formulario de Setup Inicial');
    console.log('4. Completa el formulario con la nueva estructura');
    
  } catch (error) {
    if (error.code === 26) {
      console.log('ℹ️  La colección "instituciones" no existe o ya está vacía');
    } else {
      console.error('❌ Error al eliminar la colección:', error.message);
    }
  } finally {
    await mongoose.connection.close();
    console.log('Conexión cerrada');
    process.exit(0);
  }
}

resetInstituciones();