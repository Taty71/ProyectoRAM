const mongoose = require('mongoose');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Materia = require('../models/Materia');
const Institucion = require('../models/Institucion');
require('dotenv').config();

async function poblarDatosEjemplo() {
  try {
    // Conectar a la base de datos
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ram_db');
    console.log('✅ Conectado a MongoDB');

    // Buscar la institución
    const institucion = await Institucion.findOne({ codigo: 'ETP001' });
    if (!institucion) {
      console.log('❌ Primero ejecuta: npm run init');
      process.exit(1);
    }

    console.log('🏫 Poblando datos para:', institucion.nombre);

    // Crear profesores de ejemplo
    const profesores = [
      {
        email: 'jefe.cbu@escuela.edu.ar',
        password: 'jefe123',
        nombre: 'María',
        apellido: 'García',
        dni: '23456789',
        rol: 'jefe_area',
        institucion: institucion._id,
        especialidades: ['CBU']
      },
      {
        email: 'jefe.electricidad@escuela.edu.ar',
        password: 'jefe123',
        nombre: 'Carlos',
        apellido: 'López',
        dni: '34567890',
        rol: 'jefe_area',
        institucion: institucion._id,
        especialidades: ['Electricidad']
      },
      {
        email: 'jefe.programacion@escuela.edu.ar',
        password: 'jefe123',
        nombre: 'Ana',
        apellido: 'Martínez',
        dni: '45678901',
        rol: 'jefe_area',
        institucion: institucion._id,
        especialidades: ['Programación']
      },
      {
        email: 'prof.matematica@escuela.edu.ar',
        password: 'prof123',
        nombre: 'Roberto',
        apellido: 'Fernández',
        dni: '56789012',
        rol: 'profesor',
        institucion: institucion._id,
        especialidades: ['CBU', 'Electricidad', 'Programación']
      },
      {
        email: 'prof.lengua@escuela.edu.ar',
        password: 'prof123',
        nombre: 'Laura',
        apellido: 'Rodríguez',
        dni: '67890123',
        rol: 'profesor',
        institucion: institucion._id,
        especialidades: ['CBU', 'Electricidad', 'Programación']
      },
      {
        email: 'prof.fisica@escuela.edu.ar',
        password: 'prof123',
        nombre: 'Miguel',
        apellido: 'Sánchez',
        dni: '78901234',
        rol: 'profesor',
        institucion: institucion._id,
        especialidades: ['CBU', 'Electricidad']
      },
      {
        email: 'prof.electronica@escuela.edu.ar',
        password: 'prof123',
        nombre: 'Patricia',
        apellido: 'Gómez',
        dni: '89012345',
        rol: 'profesor',
        institucion: institucion._id,
        especialidades: ['Electricidad']
      },
      {
        email: 'prof.algoritmos@escuela.edu.ar',
        password: 'prof123',
        nombre: 'Diego',
        apellido: 'Torres',
        dni: '90123456',
        rol: 'profesor',
        institucion: institucion._id,
        especialidades: ['Programación']
      },
      {
        email: 'prof.base_datos@escuela.edu.ar',
        password: 'prof123',
        nombre: 'Silvia',
        apellido: 'Morales',
        dni: '01234567',
        rol: 'profesor',
        institucion: institucion._id,
        especialidades: ['Programación']
      }
    ];

    console.log('👥 Creando profesores...');
    for (const profData of profesores) {
      const profExistente = await Usuario.findOne({ email: profData.email });
      if (!profExistente) {
        const profesor = new Usuario(profData);
        await profesor.save();
        console.log(`   ✅ ${profData.nombre} ${profData.apellido} - ${profData.rol === 'jefe_area' ? 'Jefe de área' : profData.rol}`);
      }
    }

    // Buscar profesores creados para asignar materias
    const profesoresCreados = await Usuario.find({ 
      institucion: institucion._id,
      rol: { $in: ['profesor', 'jefe_area'] }
    });

    // Crear materias por año y especialidad
    const materias = [
      // CBU - 1° Año
      { nombre: 'Matemática I', codigo: 'MAT1', especialidad: 'CBU', año: 1, profesorEmail: 'prof.matematica@escuela.edu.ar' },
      { nombre: 'Lengua y Literatura I', codigo: 'LEN1', especialidad: 'CBU', año: 1, profesorEmail: 'prof.lengua@escuela.edu.ar' },
      { nombre: 'Física I', codigo: 'FIS1', especialidad: 'CBU', año: 1, profesorEmail: 'prof.fisica@escuela.edu.ar' },
      { nombre: 'Tecnología I', codigo: 'TEC1', especialidad: 'CBU', año: 1, profesorEmail: 'jefe.cbu@escuela.edu.ar' },
      
      // CBU - 2° Año
      { nombre: 'Matemática II', codigo: 'MAT2', especialidad: 'CBU', año: 2, profesorEmail: 'prof.matematica@escuela.edu.ar' },
      { nombre: 'Lengua y Literatura II', codigo: 'LEN2', especialidad: 'CBU', año: 2, profesorEmail: 'prof.lengua@escuela.edu.ar' },
      { nombre: 'Física II', codigo: 'FIS2', especialidad: 'CBU', año: 2, profesorEmail: 'prof.fisica@escuela.edu.ar' },
      { nombre: 'Tecnología II', codigo: 'TEC2', especialidad: 'CBU', año: 2, profesorEmail: 'jefe.cbu@escuela.edu.ar' },
      
      // CBU - 3° Año
      { nombre: 'Matemática III', codigo: 'MAT3', especialidad: 'CBU', año: 3, profesorEmail: 'prof.matematica@escuela.edu.ar' },
      { nombre: 'Lengua y Literatura III', codigo: 'LEN3', especialidad: 'CBU', año: 3, profesorEmail: 'prof.lengua@escuela.edu.ar' },
      { nombre: 'Física III', codigo: 'FIS3', especialidad: 'CBU', año: 3, profesorEmail: 'prof.fisica@escuela.edu.ar' },
      { nombre: 'Introducción a la Electricidad', codigo: 'IEL3', especialidad: 'CBU', año: 3, profesorEmail: 'prof.electronica@escuela.edu.ar' },
      { nombre: 'Introducción a la Programación', codigo: 'IPR3', especialidad: 'CBU', año: 3, profesorEmail: 'prof.algoritmos@escuela.edu.ar' },
      
      // Electricidad - 4° Año
      { nombre: 'Circuitos Eléctricos I', codigo: 'CEL4', especialidad: 'Electricidad', año: 4, profesorEmail: 'prof.electronica@escuela.edu.ar' },
      { nombre: 'Electrónica Analógica I', codigo: 'EAN4', especialidad: 'Electricidad', año: 4, profesorEmail: 'prof.electronica@escuela.edu.ar' },
      { nombre: 'Instalaciones Eléctricas I', codigo: 'IEL4', especialidad: 'Electricidad', año: 4, profesorEmail: 'jefe.electricidad@escuela.edu.ar' },
      { nombre: 'Matemática Aplicada', codigo: 'MAP4', especialidad: 'Electricidad', año: 4, profesorEmail: 'prof.matematica@escuela.edu.ar' },
      
      // Electricidad - 5° Año
      { nombre: 'Circuitos Eléctricos II', codigo: 'CEL5', especialidad: 'Electricidad', año: 5, profesorEmail: 'prof.electronica@escuela.edu.ar' },
      { nombre: 'Electrónica Digital', codigo: 'EDI5', especialidad: 'Electricidad', año: 5, profesorEmail: 'prof.electronica@escuela.edu.ar' },
      { nombre: 'Instalaciones Eléctricas II', codigo: 'IEL5', especialidad: 'Electricidad', año: 5, profesorEmail: 'jefe.electricidad@escuela.edu.ar' },
      { nombre: 'Máquinas Eléctricas I', codigo: 'MEL5', especialidad: 'Electricidad', año: 5, profesorEmail: 'jefe.electricidad@escuela.edu.ar' },
      
      // Electricidad - 6° Año
      { nombre: 'Proyecto Final Electricidad', codigo: 'PFE6', especialidad: 'Electricidad', año: 6, profesorEmail: 'jefe.electricidad@escuela.edu.ar' },
      { nombre: 'Automatización Industrial', codigo: 'AIN6', especialidad: 'Electricidad', año: 6, profesorEmail: 'prof.electronica@escuela.edu.ar' },
      { nombre: 'Máquinas Eléctricas II', codigo: 'MEL6', especialidad: 'Electricidad', año: 6, profesorEmail: 'jefe.electricidad@escuela.edu.ar' },
      
      // Programación - 4° Año
      { nombre: 'Algoritmos y Programación I', codigo: 'ALG4', especialidad: 'Programación', año: 4, profesorEmail: 'prof.algoritmos@escuela.edu.ar' },
      { nombre: 'Estructuras de Datos I', codigo: 'EDA4', especialidad: 'Programación', año: 4, profesorEmail: 'prof.algoritmos@escuela.edu.ar' },
      { nombre: 'Sistemas Operativos I', codigo: 'SOP4', especialidad: 'Programación', año: 4, profesorEmail: 'jefe.programacion@escuela.edu.ar' },
      { nombre: 'Matemática Discreta', codigo: 'MAD4', especialidad: 'Programación', año: 4, profesorEmail: 'prof.matematica@escuela.edu.ar' },
      
      // Programación - 5° Año
      { nombre: 'Algoritmos y Programación II', codigo: 'ALG5', especialidad: 'Programación', año: 5, profesorEmail: 'prof.algoritmos@escuela.edu.ar' },
      { nombre: 'Base de Datos I', codigo: 'BDA5', especialidad: 'Programación', año: 5, profesorEmail: 'prof.base_datos@escuela.edu.ar' },
      { nombre: 'Desarrollo Web I', codigo: 'DWE5', especialidad: 'Programación', año: 5, profesorEmail: 'jefe.programacion@escuela.edu.ar' },
      { nombre: 'Ingeniería de Software I', codigo: 'ISW5', especialidad: 'Programación', año: 5, profesorEmail: 'jefe.programacion@escuela.edu.ar' },
      
      // Programación - 6° Año
      { nombre: 'Proyecto Final Programación', codigo: 'PFP6', especialidad: 'Programación', año: 6, profesorEmail: 'jefe.programacion@escuela.edu.ar' },
      { nombre: 'Base de Datos II', codigo: 'BDA6', especialidad: 'Programación', año: 6, profesorEmail: 'prof.base_datos@escuela.edu.ar' },
      { nombre: 'Desarrollo Web II', codigo: 'DWE6', especialidad: 'Programación', año: 6, profesorEmail: 'jefe.programacion@escuela.edu.ar' }
    ];

    console.log('📚 Creando materias...');
    for (const materiaData of materias) {
      const profesor = profesoresCreados.find(p => p.email === materiaData.profesorEmail);
      if (profesor) {
        const materiaExistente = await Materia.findOne({ 
          codigo: materiaData.codigo,
          institucion: institucion._id 
        });
        
        if (!materiaExistente) {
          const materia = new Materia({
            nombre: materiaData.nombre,
            codigo: materiaData.codigo,
            institucion: institucion._id,
            especialidad: materiaData.especialidad,
            año: materiaData.año,
            profesor: profesor._id,
            cicloAcademico: new Date().getFullYear(),
            activa: true
          });
          
          await materia.save();
          console.log(`   ✅ ${materiaData.especialidad} ${materiaData.año}° - ${materiaData.nombre}`);
        }
      }
    }

    // Crear estudiantes de ejemplo
    const estudiantes = [];
    const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Lucía', 'Diego', 'Sofía', 'Martín', 'Valentina'];
    const apellidos = ['García', 'López', 'Martínez', 'Rodríguez', 'Fernández', 'González', 'Pérez', 'Sánchez', 'Romero', 'Torres'];

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
          password: 'est123',
          institucion: institucion._id,
          especialidad: 'CBU',
          año,
          division: 'A',
          cicloAcademico: new Date().getFullYear(),
          fechaNacimiento: new Date(2007 - año, 5, 15),
          fechaIngreso: new Date(2024 - año + 1, 2, 1),
          estadoAcademico: 'activo'
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
          password: 'est123',
          institucion: institucion._id,
          especialidad: 'Electricidad',
          año,
          division: 'A',
          cicloAcademico: new Date().getFullYear(),
          fechaNacimiento: new Date(2007 - año, 5, 15),
          fechaIngreso: new Date(2024 - año + 1, 2, 1),
          estadoAcademico: 'activo'
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
          password: 'est123',
          institucion: institucion._id,
          especialidad: 'Programación',
          año,
          division: 'A',
          cicloAcademico: new Date().getFullYear(),
          fechaNacimiento: new Date(2007 - año, 5, 15),
          fechaIngreso: new Date(2024 - año + 1, 2, 1),
          estadoAcademico: 'activo'
        });
      }
    }

    console.log('🎓 Creando estudiantes...');
    for (const estData of estudiantes) {
      const estExistente = await Estudiante.findOne({ 
        idEstudiante: estData.idEstudiante 
      });
      
      if (!estExistente) {
        const estudiante = new Estudiante(estData);
        await estudiante.save();
      }
    }

    console.log(`   ✅ ${estudiantes.length} estudiantes creados`);
    
    console.log('');
    console.log('🎉 Base de datos poblada exitosamente!');
    console.log('');
    console.log('👥 USUARIOS CREADOS:');
        console.log('📧 Jefes de área: jefe.cbu@escuela.edu.ar, jefe.electricidad@escuela.edu.ar, jefe.programacion@escuela.edu.ar');
    console.log('👨‍🏫 Profesores: prof.matematica@escuela.edu.ar, prof.lengua@escuela.edu.ar, etc.');
    console.log('🔑 Contraseña profesores: prof123 / jefe123');
    console.log('');
    console.log('🎓 ESTUDIANTES:');
    console.log('📝 Formato número: CBU1001, ELE4001, PRG4001, etc.');
    console.log('🔑 Contraseña estudiantes: est123');
    console.log('');
    console.log('📊 RESUMEN:');
    console.log(`   CBU: ${3 * 10} estudiantes (10 por año)`);
    console.log(`   Electricidad: ${3 * 8} estudiantes (8 por año)`);
    console.log(`   Programación: ${3 * 8} estudiantes (8 por año)`);
    console.log(`   Total: ${estudiantes.length} estudiantes`);

  } catch (error) {
    console.error('❌ Error al poblar datos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexión cerrada');
    process.exit(0);
  }
}

poblarDatosEjemplo();
