/**
 * Script de mantenimiento: elimina índices únicos sobre 'email' en colecciones
 * "usuarios" y "estudiantes" si existen. Ejecutar sólo una vez en entornos locales
 * o durante mantenimiento controlado.
 *
 * Uso:
 *   node remove_unique_email_index.js
 *
 * El script hace un listado de índices y elimina cualquier índice que tenga la
 * propiedad unique:true y cuyo campo sea 'email'. Es conservador: solo eliminará
 * índices exactamente sobre { email: 1 }.
 */

const { MongoClient } = require('mongodb');
const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/ram_db';

async function run() {
  const client = new MongoClient(uri, { useUnifiedTopology: true });
  try {
    await client.connect();
    console.log('Conectado a MongoDB:', uri);
    const db = client.db();
    const collections = ['usuarios', 'estudiantes'];
    for (const collName of collections) {
      const coll = db.collection(collName);
      const indexes = await coll.indexes();
      console.log(`\nColección: ${collName}`);
      for (const idx of indexes) {
        console.log(' - Índice encontrado:', idx.name, JSON.stringify(idx.key), 'unique=', !!idx.unique);
        if (idx.unique && JSON.stringify(idx.key) === JSON.stringify({ email: 1 })) {
          console.log(`   -> Eliminando índice único '${idx.name}' en ${collName}...`);
          await coll.dropIndex(idx.name);
          console.log('   -> Eliminado.');
        }
      }
    }
    console.log('\nScript finalizado. Verificá que los índices problemáticos fueron removidos.');
  } catch (err) {
    console.error('Error en script:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

run();
