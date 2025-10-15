const mongoose = require('mongoose');

const conectarBD = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ram_db';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4, // Forzar IPv4
    });
    
    console.log('📊 Base de datos MongoDB conectada exitosamente');
    console.log(`🔗 URI: ${mongoURI}`);
    
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error);
    process.exit(1);
  }
};

// Manejar eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('✅ Mongoose conectado a MongoDB');
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Error de conexión MongoDB:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose desconectado de MongoDB');
});

// Cerrar conexión cuando la app se cierre
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔄 Conexión MongoDB cerrada por terminación de la aplicación');
  process.exit(0);
});

module.exports = conectarBD;
