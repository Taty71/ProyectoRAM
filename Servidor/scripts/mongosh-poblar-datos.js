// ===============================
// Script de población de datos para MongoDB Shell (mongosh)
// ===============================
// Uso: mongosh mongodb://127.0.0.1:27017/ram_db < mongosh-poblar-datos.js
// O copia y pega este código en la shell de mongosh

print("🚀 Iniciando población de datos de ejemplo en MongoDB Shell...");

// Buscar la institución
const institucion = db.instituciones.findOne({ codigo: "ETP001" });
if (!institucion) {
  print("❌ Primero ejecuta el script de inicialización: mongosh-init.js");
  quit();
}

print(`🏫 Poblando datos para: ${institucion.nombre}`);

// ===============================
// CREAR PROFESORES Y JEFES DE ÁREA
// ===============================

const profesores = [
  // Jefes de Área CBU
  {
    email: "jefe.matematica@escuela.edu.ar",
    password: "jefe123",
    nombre: "María",
    apellido: "García",
    dni: "23456789",
    rol: "jefe_area",
    institucion: institucion._id,
    especialidades: ["Matemática"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "jefe.ciencias_naturales@escuela.edu.ar",
    password: "jefe123",
    nombre: "Carlos",
    apellido: "López",
    dni: "34567890",
    rol: "jefe_area",
    institucion: institucion._id,
    especialidades: ["Ciencias Naturales"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "jefe.ciencias_sociales@escuela.edu.ar",
    password: "jefe123",
    nombre: "Ana",
    apellido: "Martínez",
    dni: "45678901",
    rol: "jefe_area",
    institucion: institucion._id,
    especialidades: ["Ciencias Sociales"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "jefe.artes_educacion_fisica@escuela.edu.ar",
    password: "jefe123",
    nombre: "Laura",
    apellido: "Rodríguez",
    dni: "67890123",
    rol: "jefe_area",
    institucion: institucion._id,
    especialidades: ["Artes", "Educación Física"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "jefe.utp@escuela.edu.ar",
    password: "jefe123",
    nombre: "Miguel",
    apellido: "Sánchez",
    dni: "78901234",
    rol: "jefe_area",
    institucion: institucion._id,
    especialidades: ["UTP"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Jefes de Área Especialidades
  {
    email: "jefe.electricidad@escuela.edu.ar",
    password: "jefe123",
    nombre: "Patricia",
    apellido: "Gómez",
    dni: "89012345",
    rol: "jefe_area",
    institucion: institucion._id,
    especialidades: ["Electricidad"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "jefe.programacion@escuela.edu.ar",
    password: "jefe123",
    nombre: "Diego",
    apellido: "Torres",
    dni: "90123456",
    rol: "jefe_area",
    institucion: institucion._id,
    especialidades: ["Programación"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Profesores CBU
  {
    email: "prof.lengua@escuela.edu.ar",
    password: "prof123",
    nombre: "Silvia",
    apellido: "Morales",
    dni: "01234567",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Lengua y Literatura"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.educacion_fisica@escuela.edu.ar",
    password: "prof123",
    nombre: "Roberto",
    apellido: "Fernández",
    dni: "56789012",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Educación Física"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.geografia@escuela.edu.ar",
    password: "prof123",
    nombre: "Carmen",
    apellido: "Vega",
    dni: "11223344",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Ciencias Sociales"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.historia@escuela.edu.ar",
    password: "prof123",
    nombre: "Alberto",
    apellido: "Ruiz",
    dni: "22334455",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Ciencias Sociales"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.biologia@escuela.edu.ar",
    password: "prof123",
    nombre: "Elena",
    apellido: "Castro",
    dni: "33445566",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Ciencias Naturales"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.fisica@escuela.edu.ar",
    password: "prof123",
    nombre: "Marcos",
    apellido: "Silva",
    dni: "44556677",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Ciencias Naturales"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.quimica@escuela.edu.ar",
    password: "prof123",
    nombre: "Natalia",
    apellido: "Herrera",
    dni: "55667788",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Ciencias Naturales"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.matematica@escuela.edu.ar",
    password: "prof123",
    nombre: "Jorge",
    apellido: "Mendez",
    dni: "66778899",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Matemática"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.ciudadania@escuela.edu.ar",
    password: "prof123",
    nombre: "Gloria",
    apellido: "Paz",
    dni: "77889900",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Formación Ciudadana"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.ingles@escuela.edu.ar",
    password: "prof123",
    nombre: "Sandra",
    apellido: "López",
    dni: "88990011",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Lengua Extranjera"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.artes_visuales@escuela.edu.ar",
    password: "prof123",
    nombre: "Adriana",
    apellido: "Flores",
    dni: "99001122",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Artes"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.musica@escuela.edu.ar",
    password: "prof123",
    nombre: "Fernando",
    apellido: "Aguilar",
    dni: "10111213",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Artes"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.plastica@escuela.edu.ar",
    password: "prof123",
    nombre: "Valeria",
    apellido: "Ortiz",
    dni: "12131415",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Artes"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // Profesores Especialidades
  {
    email: "prof.electronica@escuela.edu.ar",
    password: "prof123",
    nombre: "Raúl",
    apellido: "Moreno",
    dni: "13141516",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Electricidad"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.aplicaciones@escuela.edu.ar",
    password: "prof123",
    nombre: "Cristina",
    apellido: "Maia",
    dni: "14151617",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Programación"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    email: "prof.base_datos@escuela.edu.ar",
    password: "prof123",
    nombre: "Viviana",
    apellido: "Molina",
    dni: "15161718",
    rol: "profesor",
    institucion: institucion._id,
    especialidades: ["Programación"],
    activo: true,
    fechaRegistro: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

print("👥 Creando profesores...");
let profesoresCreados = 0;
profesores.forEach(profData => {
  const profExistente = db.usuarios.findOne({ email: profData.email });
  if (!profExistente) {
    const result = db.usuarios.insertOne(profData);
    if (result.acknowledged) {
      profesoresCreados++;
      print(`   ✅ ${profData.nombre} ${profData.apellido} - ${profData.rol === 'jefe_area' ? 'Jefe de área' : profData.rol}`);
    }
  }
});

// ===============================
// CREAR MATERIAS
// ===============================

// Buscar profesores creados para asignar materias
const profesoresEnDB = db.usuarios.find({ 
  institucion: institucion._id,
  rol: { $in: ["profesor", "jefe_area"] }
}).toArray();

const materias = [
  // CBU - 1° Año
  { nombre: "Lengua y Literatura", codigo: "LEN1", especialidad: "CBU", año: 1, profesorEmail: "prof.lengua@escuela.edu.ar" },
  { nombre: "Educación Física", codigo: "EFI1", especialidad: "CBU", año: 1, profesorEmail: "prof.educacion_fisica@escuela.edu.ar" },
  { nombre: "Ciencias Sociales - Geografía", codigo: "GEO1", especialidad: "CBU", año: 1, profesorEmail: "prof.geografia@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Biología", codigo: "BIO1", especialidad: "CBU", año: 1, profesorEmail: "prof.biologia@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Física", codigo: "FIS1", especialidad: "CBU", año: 1, profesorEmail: "prof.fisica@escuela.edu.ar" },
  { nombre: "Matemática", codigo: "MAT1", especialidad: "CBU", año: 1, profesorEmail: "prof.matematica@escuela.edu.ar" },
  { nombre: "Ciudadanía y Participación", codigo: "CYP1", especialidad: "CBU", año: 1, profesorEmail: "prof.ciudadania@escuela.edu.ar" },
  { nombre: "Lengua Extranjera - Inglés", codigo: "ING1", especialidad: "CBU", año: 1, profesorEmail: "prof.ingles@escuela.edu.ar" },
  { nombre: "Educación Artística: Arte Visuales", codigo: "ART1", especialidad: "CBU", año: 1, profesorEmail: "prof.artes_visuales@escuela.edu.ar" },
  { nombre: "Educación Tecnológica", codigo: "TEC1", especialidad: "CBU", año: 1, profesorEmail: "jefe.utp@escuela.edu.ar" },
  { nombre: "Dibujo Técnico", codigo: "DT1", especialidad: "CBU", año: 1, profesorEmail: "jefe.utp@escuela.edu.ar" },
  { nombre: "Taller de Laboratorio", codigo: "TL1", especialidad: "CBU", año: 1, profesorEmail: "jefe.utp@escuela.edu.ar" },
  
  // CBU - 2° Año
  { nombre: "Lengua y Literatura", codigo: "LEN2", especialidad: "CBU", año: 2, profesorEmail: "prof.lengua@escuela.edu.ar" },
  { nombre: "Educación Física", codigo: "EFI2", especialidad: "CBU", año: 2, profesorEmail: "prof.educacion_fisica@escuela.edu.ar" },
  { nombre: "Ciencias Sociales - Historia", codigo: "HIS2", especialidad: "CBU", año: 2, profesorEmail: "prof.historia@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Biología", codigo: "BIO2", especialidad: "CBU", año: 2, profesorEmail: "prof.biologia@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Química", codigo: "QUI2", especialidad: "CBU", año: 2, profesorEmail: "prof.quimica@escuela.edu.ar" },
  { nombre: "Matemática", codigo: "MAT2", especialidad: "CBU", año: 2, profesorEmail: "prof.matematica@escuela.edu.ar" },
  { nombre: "Ciudadanía y Participación", codigo: "CYP2", especialidad: "CBU", año: 2, profesorEmail: "prof.ciudadania@escuela.edu.ar" },
  { nombre: "Lengua Extranjera - Inglés", codigo: "ING2", especialidad: "CBU", año: 2, profesorEmail: "prof.ingles@escuela.edu.ar" },
  { nombre: "Educación Artística: Música", codigo: "MUS2", especialidad: "CBU", año: 2, profesorEmail: "prof.musica@escuela.edu.ar" },
  { nombre: "Educación Tecnológica", codigo: "TEC2", especialidad: "CBU", año: 2, profesorEmail: "jefe.utp@escuela.edu.ar" },
  { nombre: "Dibujo Técnico", codigo: "DT2", especialidad: "CBU", año: 2, profesorEmail: "jefe.utp@escuela.edu.ar" },
  { nombre: "Taller de Laboratorio", codigo: "TL2", especialidad: "CBU", año: 2, profesorEmail: "jefe.utp@escuela.edu.ar" },
  
  // CBU - 3° Año
  { nombre: "Lengua y Literatura", codigo: "LEN3", especialidad: "CBU", año: 3, profesorEmail: "prof.lengua@escuela.edu.ar" },
  { nombre: "Educación Física", codigo: "EFI3", especialidad: "CBU", año: 3, profesorEmail: "prof.educacion_fisica@escuela.edu.ar" },
  { nombre: "Ciencias Sociales - Geografía", codigo: "GEO3", especialidad: "CBU", año: 3, profesorEmail: "prof.geografia@escuela.edu.ar" },
  { nombre: "Ciencias Sociales - Historia", codigo: "HIS3", especialidad: "CBU", año: 3, profesorEmail: "prof.historia@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Química", codigo: "QUI3", especialidad: "CBU", año: 3, profesorEmail: "prof.quimica@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Física", codigo: "FIS3", especialidad: "CBU", año: 3, profesorEmail: "prof.fisica@escuela.edu.ar" },
  { nombre: "Matemática", codigo: "MAT3", especialidad: "CBU", año: 3, profesorEmail: "prof.matematica@escuela.edu.ar" },
  { nombre: "Formación para la Vida y el Trabajo", codigo: "FVT3", especialidad: "CBU", año: 3, profesorEmail: "prof.ciudadania@escuela.edu.ar" },
  { nombre: "Lengua Extranjera - Inglés", codigo: "ING3", especialidad: "CBU", año: 3, profesorEmail: "prof.ingles@escuela.edu.ar" },
  { nombre: "Educación Artística: Plástica", codigo: "PLA3", especialidad: "CBU", año: 3, profesorEmail: "prof.plastica@escuela.edu.ar" },
  { nombre: "Educación Tecnológica", codigo: "TEC3", especialidad: "CBU", año: 3, profesorEmail: "jefe.utp@escuela.edu.ar" },
  { nombre: "Dibujo Técnico", codigo: "DT3", especialidad: "CBU", año: 3, profesorEmail: "jefe.utp@escuela.edu.ar" },
  { nombre: "Taller de Laboratorio", codigo: "TL3", especialidad: "CBU", año: 3, profesorEmail: "jefe.utp@escuela.edu.ar" },
  
  // Electricidad - 4° Año
  { nombre: "Lengua y Literatura", codigo: "LEN4E", especialidad: "Electricidad", año: 4, profesorEmail: "prof.lengua@escuela.edu.ar" },
  { nombre: "Ciencias Sociales - Historia", codigo: "HIS4E", especialidad: "Electricidad", año: 4, profesorEmail: "prof.historia@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Biología", codigo: "BIO4E", especialidad: "Electricidad", año: 4, profesorEmail: "prof.biologia@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Química", codigo: "QUI4E", especialidad: "Electricidad", año: 4, profesorEmail: "prof.quimica@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Física", codigo: "FIS4E", especialidad: "Electricidad", año: 4, profesorEmail: "prof.fisica@escuela.edu.ar" },
  { nombre: "Lengua Extranjera - Inglés", codigo: "ING4E", especialidad: "Electricidad", año: 4, profesorEmail: "prof.ingles@escuela.edu.ar" },
  { nombre: "Educación Artística", codigo: "ART4E", especialidad: "Electricidad", año: 4, profesorEmail: "prof.artes_visuales@escuela.edu.ar" },
  { nombre: "Educación Física", codigo: "EFI4E", especialidad: "Electricidad", año: 4, profesorEmail: "prof.educacion_fisica@escuela.edu.ar" },
  { nombre: "Proyecto y Representación Gráfica I", codigo: "PRG4E", especialidad: "Electricidad", año: 4, profesorEmail: "jefe.utp@escuela.edu.ar" },
  { nombre: "Mediciones Eléctricas", codigo: "MED4E", especialidad: "Electricidad", año: 4, profesorEmail: "prof.electronica@escuela.edu.ar" },
  { nombre: "Electrotecnia", codigo: "ELE4E", especialidad: "Electricidad", año: 4, profesorEmail: "jefe.electricidad@escuela.edu.ar" },
  { nombre: "Instalaciones Eléctricas I", codigo: "INS4E", especialidad: "Electricidad", año: 4, profesorEmail: "jefe.electricidad@escuela.edu.ar" },
  
  // Programación - 4° Año
  { nombre: "Lengua y Literatura", codigo: "LEN4P", especialidad: "Programación", año: 4, profesorEmail: "prof.lengua@escuela.edu.ar" },
  { nombre: "Ciencias Sociales - Historia", codigo: "HIS4P", especialidad: "Programación", año: 4, profesorEmail: "prof.historia@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Biología", codigo: "BIO4P", especialidad: "Programación", año: 4, profesorEmail: "prof.biologia@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Química", codigo: "QUI4P", especialidad: "Programación", año: 4, profesorEmail: "prof.quimica@escuela.edu.ar" },
  { nombre: "Ciencias Naturales - Física", codigo: "FIS4P", especialidad: "Programación", año: 4, profesorEmail: "prof.fisica@escuela.edu.ar" },
  { nombre: "Lengua Extranjera - Inglés", codigo: "ING4P", especialidad: "Programación", año: 4, profesorEmail: "prof.ingles@escuela.edu.ar" },
  { nombre: "Educación Artística", codigo: "ART4P", especialidad: "Programación", año: 4, profesorEmail: "prof.artes_visuales@escuela.edu.ar" },
  { nombre: "Educación Física", codigo: "EFI4P", especialidad: "Programación", año: 4, profesorEmail: "prof.educacion_fisica@escuela.edu.ar" },
  { nombre: "Informática Aplicada I", codigo: "INF4P", especialidad: "Programación", año: 4, profesorEmail: "jefe.programacion@escuela.edu.ar" },
  { nombre: "Lógica Matemática", codigo: "LOG4P", especialidad: "Programación", año: 4, profesorEmail: "prof.matematica@escuela.edu.ar" },
  { nombre: "Programación I", codigo: "PR14P", especialidad: "Programación", año: 4, profesorEmail: "prof.algoritmos@escuela.edu.ar" },
  
  // Electricidad - 5° Año
  { nombre: "Lengua y Literatura", codigo: "LEN5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.lengua@escuela.edu.ar" },
  { nombre: "Psicología", codigo: "PSI5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.ciudadania@escuela.edu.ar" },
  { nombre: "Geografía", codigo: "GEO5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.geografia@escuela.edu.ar" },
  { nombre: "Historia", codigo: "HIS5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.historia@escuela.edu.ar" },
  { nombre: "Lengua Extranjera - Inglés", codigo: "ING5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.ingles@escuela.edu.ar" },
  { nombre: "Educación Artística: Música", codigo: "MUS5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.musica@escuela.edu.ar" },
  { nombre: "Educación Física", codigo: "EFI5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.educacion_fisica@escuela.edu.ar" },
  { nombre: "Matemática", codigo: "MAT5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.matematica@escuela.edu.ar" },
  { nombre: "Física", codigo: "FIS5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.fisica@escuela.edu.ar" },
  { nombre: "Química", codigo: "QUI5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.quimica@escuela.edu.ar" },
  { nombre: "Electrónica", codigo: "ELE5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.electronica@escuela.edu.ar" },
  { nombre: "Máquinas Eléctricas I", codigo: "MAQ5E", especialidad: "Electricidad", año: 5, profesorEmail: "jefe.electricidad@escuela.edu.ar" },
  { nombre: "Instalaciones Eléctricas II", codigo: "INS5E", especialidad: "Electricidad", año: 5, profesorEmail: "jefe.electricidad@escuela.edu.ar" },
  { nombre: "Mediciones Eléctricas II", codigo: "MED5E", especialidad: "Electricidad", año: 5, profesorEmail: "prof.electronica@escuela.edu.ar" },
  { nombre: "Proyecto y Representación Gráfica II", codigo: "PRG5E", especialidad: "Electricidad", año: 5, profesorEmail: "jefe.utp@escuela.edu.ar" },
  
  // Programación - 5° Año
  { nombre: "Lengua y Literatura", codigo: "LEN5P", especialidad: "Programación", año: 5, profesorEmail: "prof.lengua@escuela.edu.ar" },
  { nombre: "Psicología", codigo: "PSI5P", especialidad: "Programación", año: 5, profesorEmail: "prof.ciudadania@escuela.edu.ar" },
  { nombre: "Geografía", codigo: "GEO5P", especialidad: "Programación", año: 5, profesorEmail: "prof.geografia@escuela.edu.ar" },
  { nombre: "Historia", codigo: "HIS5P", especialidad: "Programación", año: 5, profesorEmail: "prof.historia@escuela.edu.ar" },
  { nombre: "Lengua Extranjera - Inglés", codigo: "ING5P", especialidad: "Programación", año: 5, profesorEmail: "prof.ingles@escuela.edu.ar" },
  { nombre: "Educación Artística: Música", codigo: "MUS5P", especialidad: "Programación", año: 5, profesorEmail: "prof.musica@escuela.edu.ar" },
  { nombre: "Educación Física", codigo: "EFI5P", especialidad: "Programación", año: 5, profesorEmail: "prof.educacion_fisica@escuela.edu.ar" },
  { nombre: "Matemática", codigo: "MAT5P", especialidad: "Programación", año: 5, profesorEmail: "prof.matematica@escuela.edu.ar" },
  { nombre: "Física", codigo: "FIS5P", especialidad: "Programación", año: 5, profesorEmail: "prof.fisica@escuela.edu.ar" },
  { nombre: "Química", codigo: "QUI5P", especialidad: "Programación", año: 5, profesorEmail: "prof.quimica@escuela.edu.ar" },
  { nombre: "Informática Aplicada II", codigo: "INF5P", especialidad: "Programación", año: 5, profesorEmail: "jefe.programacion@escuela.edu.ar" },
  { nombre: "Sistema de Información", codigo: "SIS5P", especialidad: "Programación", año: 5, profesorEmail: "prof.base_datos@escuela.edu.ar" },
  { nombre: "Programación II", codigo: "PR25P", especialidad: "Programación", año: 5, profesorEmail: "prof.algoritmos@escuela.edu.ar" },
  
  // Electricidad - 6° Año
  { nombre: "Proyecto Final Electricidad", codigo: "PFE6", especialidad: "Electricidad", año: 6, profesorEmail: "jefe.electricidad@escuela.edu.ar" },
  { nombre: "Automatización Industrial", codigo: "AUT6E", especialidad: "Electricidad", año: 6, profesorEmail: "prof.electronica@escuela.edu.ar" },
  { nombre: "Máquinas Eléctricas II", codigo: "MAQ6E", especialidad: "Electricidad", año: 6, profesorEmail: "jefe.electricidad@escuela.edu.ar" },
  { nombre: "Instalaciones Eléctricas III", codigo: "INS6E", especialidad: "Electricidad", año: 6, profesorEmail: "jefe.electricidad@escuela.edu.ar" },
  
  // Programación - 6° Año
  { nombre: "Proyecto Final Programación", codigo: "PFP6", especialidad: "Programación", año: 6, profesorEmail: "jefe.programacion@escuela.edu.ar" },
  { nombre: "Base de Datos II", codigo: "BDA6P", especialidad: "Programación", año: 6, profesorEmail: "prof.base_datos@escuela.edu.ar" },
  { nombre: "Desarrollo Web II", codigo: "DWE6P", especialidad: "Programación", año: 6, profesorEmail: "jefe.programacion@escuela.edu.ar" },
  { nombre: "Programación III", codigo: "PR36P", especialidad: "Programación", año: 6, profesorEmail: "prof.algoritmos@escuela.edu.ar" },
  { nombre: "Ingeniería de Software II", codigo: "ISW6P", especialidad: "Programación", año: 6, profesorEmail: "jefe.programacion@escuela.edu.ar" }
];

print("📚 Creando materias...");
let materiasCreadas = 0;
materias.forEach(materiaData => {
  const profesor = profesoresEnDB.find(p => p.email === materiaData.profesorEmail);
  if (profesor) {
    const materiaExistente = db.materias.findOne({ 
      codigo: materiaData.codigo,
      institucion: institucion._id 
    });
    
    if (!materiaExistente) {
      const result = db.materias.insertOne({
        nombre: materiaData.nombre,
        codigo: materiaData.codigo,
        institucion: institucion._id,
        especialidad: materiaData.especialidad,
        año: materiaData.año,
        profesor: profesor._id,
        cicloAcademico: new Date().getFullYear(),
        activa: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      if (result.acknowledged) {
        materiasCreadas++;
        print(`   ✅ ${materiaData.especialidad} ${materiaData.año}° - ${materiaData.nombre}`);
      }
    }
  }
});

// ===============================
// CREAR ESTUDIANTES
// ===============================

const nombres = ["Juan", "María", "Carlos", "Ana", "Pedro", "Lucía", "Diego", "Sofía", "Martín", "Valentina"];
const apellidos = ["García", "López", "Martínez", "Rodríguez", "Fernández", "González", "Pérez", "Sánchez", "Romero", "Torres"];

let estudiantes = [];

// CBU - 10 estudiantes por año
for (let año = 1; año <= 3; año++) {
  for (let i = 0; i < 10; i++) {
    const nombre = nombres[i];
    const apellido = apellidos[i];
    const idEstudiante = `CBU${año}${String(i + 1).padStart(3, '0')}`;
    
    estudiantes.push({
      idEstudiante,
      nombre,
      apellido,
      dni: `${20000000 + año * 1000 + i}`,
      email: `${numeroEstudiante.toLowerCase()}@estudiante.escuela.edu.ar`,
      password: "est123",
      institucion: institucion._id,
      especialidad: "CBU",
      año,
      division: "A",
      cicloAcademico: new Date().getFullYear(),
      fechaNacimiento: new Date(2007 - año, 5, 15),
      fechaIngreso: new Date(2024 - año + 1, 2, 1),
      estadoAcademico: "activo",
      activo: true,
      fechaRegistro: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

// Electricidad - 8 estudiantes por año
for (let año = 4; año <= 6; año++) {
  for (let i = 0; i < 8; i++) {
    const nombre = nombres[i];
    const apellido = apellidos[i];
    const idEstudiante = `ELE${año}${String(i + 1).padStart(3, '0')}`;
    
    estudiantes.push({
      idEstudiante,
      nombre,
      apellido,
      dni: `${30000000 + año * 1000 + i}`,
      email: `${numeroEstudiante.toLowerCase()}@estudiante.escuela.edu.ar`,
      password: "est123",
      institucion: institucion._id,
      especialidad: "Electricidad",
      año,
      division: "A",
      cicloAcademico: new Date().getFullYear(),
      fechaNacimiento: new Date(2007 - año, 5, 15),
      fechaIngreso: new Date(2024 - año + 1, 2, 1),
      estadoAcademico: "activo",
      activo: true,
      fechaRegistro: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

// Programación - 8 estudiantes por año
for (let año = 4; año <= 6; año++) {
  for (let i = 0; i < 8; i++) {
    const nombre = nombres[i];
    const apellido = apellidos[i];
    const idEstudiante = `PRG${año}${String(i + 1).padStart(3, '0')}`;
    
    estudiantes.push({
      idEstudiante,
      nombre,
      apellido,
      dni: `${40000000 + año * 1000 + i}`,
      email: `${numeroEstudiante.toLowerCase()}@estudiante.escuela.edu.ar`,
      password: "est123",
      institucion: institucion._id,
      especialidad: "Programación",
      año,
      division: "A",
      cicloAcademico: new Date().getFullYear(),
      fechaNacimiento: new Date(2007 - año, 5, 15),
      fechaIngreso: new Date(2024 - año + 1, 2, 1),
      estadoAcademico: "activo",
      activo: true,
      fechaRegistro: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
}

print("🎓 Creando estudiantes...");
let estudiantesCreados = 0;
estudiantes.forEach(estData => {
  const estExistente = db.estudiantes.findOne({ 
    idEstudiante: estData.idEstudiante 
  });
  
  if (!estExistente) {
    const result = db.estudiantes.insertOne(estData);
    if (result.acknowledged) {
      estudiantesCreados++;
    }
  }
});

print(`   ✅ ${estudiantesCreados} estudiantes creados`);

// ===============================
// RESUMEN FINAL
// ===============================

print("");
print("🎉 Base de datos poblada exitosamente!");
print("");
print("👥 USUARIOS CREADOS:");
print("📧 Jefes de área CBU:");
print("   • Matemática: jefe.matematica@escuela.edu.ar");
print("   • Ciencias Naturales: jefe.ciencias_naturales@escuela.edu.ar");
print("   • Ciencias Sociales: jefe.ciencias_sociales@escuela.edu.ar");
print("   • Artes y Ed. Física: jefe.artes_educacion_fisica@escuela.edu.ar");
print("   • UTP: jefe.utp@escuela.edu.ar");
print("📧 Jefes de área Especialidades:");
print("   • Electricidad: jefe.electricidad@escuela.edu.ar");
print("   • Programación: jefe.programacion@escuela.edu.ar");
print("👨‍🏫 Profesores por área disponibles");
print("🔑 Contraseña profesores: prof123 / jefe123");
print("");
print("🎓 ESTUDIANTES:");
print("📝 Formato número: CBU1001, ELE4001, PRG4001, etc.");
print("🔑 Contraseña estudiantes: est123");
print("");
print("📊 RESUMEN:");
print(`   CBU: ${3 * 10} estudiantes (10 por año)`);
print(`   Electricidad: ${3 * 8} estudiantes (8 por año)`);
print(`   Programación: ${3 * 8} estudiantes (8 por año)`);
print(`   Total estudiantes: ${estudiantes.length}`);

print("");
print("📊 ESTADO FINAL DE LA BASE DE DATOS:");
print(`👥 Usuarios: ${db.usuarios.countDocuments()}`);
print(`🏫 Instituciones: ${db.instituciones.countDocuments()}`);
print(`🎓 Estudiantes: ${db.estudiantes.countDocuments()}`);
print(`📚 Materias: ${db.materias.countDocuments()}`);
