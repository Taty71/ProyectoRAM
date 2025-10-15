// ===============================
// Script de inicialización para MongoDB Shell (mongosh)
// ===============================
// Uso: mongosh mongodb://127.0.0.1:27017/ram_db < mongosh-init.js
// O copia y pega este código en la shell de mongosh

print("🚀 Iniciando configuración de R.A.M. en MongoDB Shell...");

// Verificar si ya existe un administrador
const adminExistente = db.usuarios.findOne({ rol: "administrador" });
if (adminExistente) {
  print("⚠️ Ya existe un administrador en el sistema");
  print(`📧 Email: ${adminExistente.email}`);
} else {
  
  // Verificar si ya existe la institución
  let institucion = db.instituciones.findOne({ codigo: "ETP001" });
  
  if (!institucion) {
    // Crear institución por defecto
    const resultInstitucion = db.instituciones.insertOne({
      nombre: "Instituto Provincial Educación Técnica",
      codigo: "IPET379",
      direccion: {
        calle: "Avellaneda 685",
        ciudad: "La Calera",
        provincia: "Provincia Ejemplo",
        codigoPostal: "1000"
      },
      contacto: {
        telefono: "+54 03543-5678",
        email: "contacto@institutoprovincial.edu.ar",
        sitioWeb: "www.institutoprovincial.edu.ar"
      },
      configuracion: {
        especialidades: ["cbu", "electricidad", "programacion"]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    if (resultInstitucion.acknowledged) {
      print("🏫 Institución por defecto creada");
      institucion = db.instituciones.findOne({ _id: resultInstitucion.insertedId });
    }
  } else {
    print("🏫 Institución ya existe");
  }

  // Crear usuario administrador por defecto
  // Nota: En mongosh no se aplica el hash automático de bcrypt
  // El hash se debe hacer manualmente o en el backend
  const resultAdmin = db.usuarios.insertOne({
    email: "crisbmaia.profe@gmail.com",
    password: "admin123", // ⚠️ Sin hash - cambiar en primer login
    nombre: "Administrador",
    apellido: "Sistema",
    dni: "12345678",
    rol: "administrador",
    institucion: institucion._id,
    fechaRegistro: new Date(),
    activo: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  if (resultAdmin.acknowledged) {
    print("");
    print("🎉 Sistema R.A.M. inicializado correctamente");
    print("");
    print("📋 CREDENCIALES DEL ADMINISTRADOR:");
    print("📧 Email: crisbmaia.profe@gmail.com");
    print("🔑 Contraseña: admin123");
    print("");
    print("⚠️  IMPORTANTE: La contraseña NO está hasheada");
    print("   Debes hacer login para que se hashee automáticamente");
    print("");
    print("🎓 Estructura Educativa Configurada:");
    print("   📚 CBU (Ciclo Básico Unificado): 1°, 2°, 3°");
    print("   ⚡ Técnico en Electricidad: 4°, 5°, 6°");
    print("   💻 Técnico en Programación: 4°, 5°, 6°");
  }
}

print("");
print("📊 ESTADO ACTUAL DE LA BASE DE DATOS:");
print(`👥 Usuarios: ${db.usuarios.countDocuments()}`);
print(`🏫 Instituciones: ${db.instituciones.countDocuments()}`);
print(`🎓 Estudiantes: ${db.estudiantes.countDocuments()}`);
print(`📚 Materias: ${db.materias.countDocuments()}`);
