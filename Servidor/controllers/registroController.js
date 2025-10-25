const { validationResult } = require('express-validator');
const CodigoInvitacion = require('../models/CodigoInvitacion');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');

exports.registroUsuario = async (req, res) => {
  try {
    // 🔍 LOG: Ver qué llega
    console.log('📥 DATOS RECIBIDOS:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ ERRORES DE VALIDACIÓN:', JSON.stringify(errors.array(), null, 2));
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }
    
    const { email, password, nombre, apellido, dni, rol, institucion, especialidades, ciclo, cursosACargo, codigoInvitacion } = req.body;
    // DNI es obligatorio en el sistema: validar presencia
    if (!dni || String(dni).trim() === '') {
      return res.status(400).json({ error: 'DNI es requerido para registrarse' });
    }
    
    // 🔍 LOG: Buscar código
    console.log('🔍 Buscando código:', codigoInvitacion);

    // Búsqueda tolerante para soportar documentos antiguos que no tengan campos `activo` o `usosRestantes`
    const codigo = await CodigoInvitacion.findOne({
      codigo: codigoInvitacion,
      $and: [
        { $or: [{ activo: true }, { activo: { $exists: false } }] },
        { $or: [{ usosRestantes: { $gt: 0 } }, { usosRestantes: { $exists: false } }] }
      ]
    });

    if (!codigo) {
      console.log('❌ Código no encontrado o sin usos');
      return res.status(400).json({ error: 'Código de invitación inválido, expirado o agotado' });
    }
    
    // 🔍 LOG: Verificar fecha de expiración
    console.log('📅 Código encontrado:', {
      codigo: codigo.codigo,
      fechaExpiracion: codigo.fechaExpiracion,
      fechaActual: new Date(),
      estaExpirado: codigo.fechaExpiracion && codigo.fechaExpiracion < new Date()
    });
    
    if (codigo.fechaExpiracion && codigo.fechaExpiracion < new Date()) {
      console.log('❌ Código expirado');
      return res.status(400).json({ 
        error: 'El código de invitación ha expirado',
        detalles: {
          fechaExpiracion: codigo.fechaExpiracion,
          fechaActual: new Date()
        }
      });
    }
    
    // 🔍 LOG: Verificar rol
    console.log('🔍 Verificando rol:', {
      rolDelCodigo: codigo.rol,
      rolSolicitado: rol,
      coinciden: codigo.rol === rol
    });
    
    if (codigo.rol !== rol) {
      console.log(`❌ Rol incorrecto`);
      return res.status(400).json({ error: `Este código es para registro de ${codigo.rol}, no para ${rol}` });
    }
    
  
    // Obtener la institución activa del sistema (provista por el setup)
    const institucionActiva = await Institucion.findOne({ activa: true });
    if (!institucionActiva) {
      return res.status(500).json({ error: 'No hay una institución activa configurada en el sistema' });
    }
    const institucionIdToUse = institucionActiva._id;
    // Verificar unicidad por DNI (es la clave única del sistema)
    const usuarioExistente = await Usuario.findOne({ dni: String(dni).trim() });
    if (usuarioExistente) return res.status(409).json({ error: 'El usuario ya existe (DNI duplicado)', collection: 'Usuario', field: 'dni' });
    let materiasIds = [];

    // Si el rol solicitado es 'estudiante', crear un documento en la colección `estudiantes`
    if (rol === 'estudiante') {
      const { anio, division, fechaNacimiento, especialidad } = req.body;
      // Validaciones mínimas
      if (!anio || !division || !fechaNacimiento) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para estudiante: anio, division y fechaNacimiento son requeridos.' });
      }

      // Normalizar año como número
      const yearNum = parseInt(anio, 10);

      // Helpers: extraer número de un string tipo '4to', '4º', '4°', 'cuarto', o devolver null
      const wordToNumber = (w) => {
        if (!w) return null;
        const s = String(w).toLowerCase().trim();
        const map = {
          'primero': 1,'primero.':1,'primeroº':1,'1ro':1,'1º':1,'1°':1,'1':1,'1er':1,
          'segundo':2,'2do':2,'2º':2,'2°':2,'2':2,
          'tercero':3,'3ro':3,'3º':3,'3°':3,'3':3,
          'cuarto':4,'4to':4,'4º':4,'4°':4,'4':4,
          'quinto':5,'5to':5,'5º':5,'5°':5,'5':5,
          'sexto':6,'6to':6,'6º':6,'6°':6,'6':6,
          'septimo':7,'séptimo':7,'7mo':7,'7º':7,'7°':7,'7':7
        };
        const cleaned = s.replace(/\s+/g,'').replace(/\./g,'').normalize('NFD').replace(/\p{Diacritic}/gu,'');
        if (map[cleaned] !== undefined) return map[cleaned];
        // Try to extract digit
        const m = cleaned.match(/(\d+)/);
        if (m) return parseInt(m[1],10);
        return null;
      };

      const normalizeText = (t) => {
        if (typeof t !== 'string') return '';
        return t.normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toLowerCase();
      };

      // Log para depuración: mostrar la configuración de la institución activa
      try {
        console.log('🔎 Institución activa - ciclos:', JSON.stringify(institucionActiva.ciclos, null, 2));
        console.log('🔎 Institución activa - configuracion:', JSON.stringify(institucionActiva.configuracion, null, 2));
      } catch (logErr) {
        console.warn('No se pudo loggear la configuración de la institución activa:', logErr);
      }

      // Verificar que el año pertenezca a alguno de los ciclos (si la institución define ciclos)
      let perteneceInstitucion = true;
      try {
        if (institucionActiva) {
          if (Array.isArray(institucionActiva.ciclos) && institucionActiva.ciclos.length > 0) {
            // Buscar por número dentro de los cursos definidos en los ciclos, permitiendo variantes
            const found = institucionActiva.ciclos.some(c => Array.isArray(c.cursos) && c.cursos.some(cur => {
              const num = wordToNumber(cur);
              if (num !== null && yearNum === num) return true;
              // fallback: comparar texto normalizado
              const normCur = normalizeText(cur);
              const normYear = String(yearNum);
              return normCur.includes(normYear);
            }));
            if (!found) {
              console.warn(`El año ${yearNum} no fue encontrado en los ciclos de la institución.`);
              perteneceInstitucion = false;
            }
          }
        }

        // Reglas por ciclo:
        // - Primer ciclo (CBU): años 1-3. Divisiones A/B/C (no forzamos validación estricta de divisiones aquí).
        // - Segundo ciclo (especialidades): años 4-7. Si la institución tiene especialidades definidas,
        //   entonces el estudiante DEBE enviar `especialidad` y ésta debe estar en la lista de la institución.
        if (yearNum >= 4 && yearNum <= 7) {
          const cfgEspecialidades = (institucionActiva.configuracion && Array.isArray(institucionActiva.configuracion.especialidades)) ? institucionActiva.configuracion.especialidades : [];
          if (cfgEspecialidades.length > 0) {
            // Requerir especialidad para 4-7 si la institución la define
            if (!especialidad || String(especialidad).trim() === '') {
              return res.status(400).json({ error: 'Para años 4 a 7 es obligatorio indicar la especialidad según la institución.' });
            }
            // Normalizar y comparar sin acentos
            const normEspecial = normalizeText(especialidad);
            const matches = cfgEspecialidades.map(x => normalizeText(String(x))).includes(normEspecial);
            if (!matches) {
              return res.status(400).json({ error: 'La especialidad indicada no coincide con las especialidades registradas para la institución.' });
            }
          }
        }
      } catch (errVerify) {
        console.warn('Warning verifying student belongs to institution (exception):', errVerify);
        perteneceInstitucion = true;
      }

      if (!perteneceInstitucion) {
        // Advertencia, pero no bloqueamos el registro por diferencias de formato de ciclos
        console.warn('Advertencia: el año indicado no aparece en la configuración de ciclos de la institución. Procediendo con el registro de todas formas.');
      }

      // Evitar duplicados: comprobar en Estudiante y Usuario (sólo con campos presentes)
      // Comprobar duplicado por DNI en estudiantes
      const estudianteExistenteByDni = await Estudiante.findOne({ dni: String(dni).trim() });
      if (estudianteExistenteByDni) return res.status(409).json({ error: 'El estudiante ya existe (DNI duplicado)', collection: 'Estudiante', field: 'dni' });

      // Generar idEstudiante único por año (ej: 20250001) con estrategia de reintentos
      const currentYear = new Date().getFullYear();
      let seq = await Estudiante.countDocuments({ cicloAcademico: currentYear, institucion: institucionIdToUse });
      seq = seq + 1;
      let idEstudiante = `${currentYear}${String(seq).padStart(4, '0')}`;

      // Crear el documento y reintentar en caso de colisión de índice.
      // Si tras varios intentos sigue habiendo colisiones, usamos un fallback basado en el DNI
      // para garantizar unicidad (ej: EST49563236) y, si hace falta, añadimos un sufijo timestamp.
      const MAX_SAVE_ATTEMPTS = 6;
      let saveAttempt = 0;
      let nuevoEstudiante;
      let lastSaveError = null;

      while (saveAttempt < MAX_SAVE_ATTEMPTS) {
        try {
          nuevoEstudiante = new Estudiante({
            idEstudiante,
            numeroEstudiante: idEstudiante,
            nombre,
            apellido,
            ...(dni && String(dni).trim() ? { dni: String(dni).trim() } : {}),
            email,
            password,
            institucion: institucionIdToUse,
            año: parseInt(anio, 10),
            division: String(division).toUpperCase(),
            fechaNacimiento: new Date(fechaNacimiento),
            ...(especialidad ? { especialidad } : {}),
            fechaIngreso: new Date(),
            estadoAcademico: 'activo'
          });

          await nuevoEstudiante.save();
          lastSaveError = null;
          break; // guardado exitoso
        } catch (saveErr) {
          lastSaveError = saveErr;
          // Si es error de duplicado, intentar generar otra id
          if (saveErr && saveErr.code === 11000) {
            // Si el error explícito incluye un campo viejo como 'numeroEstudiante', mapeamos
            const dupFieldRaw = Object.keys(saveErr.keyValue || {})[0] || '';
            if (dupFieldRaw === 'numeroEstudiante') {
              // Ajuste local: existe un índice antiguo en la BD que usa 'numeroEstudiante'
              // Intentamos modificar el id y reintentar
              // Intento 1..3: incrementar secuencia numérica
              if (saveAttempt < 3) {
                seq += 1;
                idEstudiante = `${currentYear}${String(seq).padStart(4, '0')}`;
              } else if (dni && String(dni).trim()) {
                // Intentos siguientes: usar DNI como base
                idEstudiante = `EST${String(dni).trim()}`;
                if (saveAttempt > 3) idEstudiante = `EST${String(dni).trim()}-${Date.now()}`;
              } else {
                // Fallback final: usar timestamp puro
                idEstudiante = `EST${Date.now()}`;
              }
            } else {
              // Caso normal: colisión en idEstudiante u otro campo
              if (saveAttempt < 3) {
                seq += 1;
                idEstudiante = `${currentYear}${String(seq).padStart(4, '0')}`;
              } else if (dni && String(dni).trim()) {
                idEstudiante = `EST${String(dni).trim()}`;
                if (saveAttempt > 3) idEstudiante = `EST${String(dni).trim()}-${Date.now()}`;
              } else {
                idEstudiante = `EST${Date.now()}`;
              }
            }
            // continuar el bucle y reintentar
          } else {
            // Error distinto a duplicado: romper y volver a lanzar
            throw saveErr;
          }
        }
        saveAttempt += 1;
      }

      if (lastSaveError) {
        // No pudimos guardar tras reintentos
        console.error('No se pudo guardar nuevo estudiante tras reintentos:', lastSaveError);
        // Si fue duplicado, responder con información útil
        if (lastSaveError.code === 11000) {
          const rawField = Object.keys(lastSaveError.keyValue || {})[0] || 'campo';
          const mappedField = rawField === 'numeroEstudiante' ? 'idEstudiante' : rawField;
          return res.status(409).json({ error: `Valor duplicado en ${mappedField}`, detalles: lastSaveError.keyValue });
        }
        return res.status(500).json({ error: 'No se pudo crear el estudiante', detalles: lastSaveError.message });
      }

      // Decrementar usos del código
      if (typeof codigo.usosRestantes === 'number') {
        codigo.usosRestantes = Math.max(0, codigo.usosRestantes - 1);
      } else {
        codigo.usosMaximos = codigo.usosMaximos || 1;
        codigo.usosRestantes = Math.max(0, (codigo.usosMaximos || 1) - 1);
      }
      if (typeof codigo.activo === 'undefined') codigo.activo = true;
      await codigo.save();

      return res.status(201).json({ mensaje: 'Estudiante creado exitosamente', estudiante: { id: nuevoEstudiante._id, idEstudiante: nuevoEstudiante.idEstudiante, nombre: nuevoEstudiante.nombreCompleto, email: nuevoEstudiante.email, especialidad: nuevoEstudiante.especialidad, año: nuevoEstudiante.año } });
    }
    if (Array.isArray(cursosACargo) && cursosACargo.length > 0) {
      const Materia = require('../models/Materia');
      for (const curso of cursosACargo) {
        const nombreMateria = curso.materia;
        const codigoMateria = `${curso.materia.substring(0,3).toUpperCase()}${curso.curso}${curso.division}`;
        // Usar la institución resuelta (institucionIdToUse) para las materias creadas
        const nuevaMateria = new Materia({ nombre: nombreMateria, codigo: codigoMateria, institucion: institucionIdToUse, ciclo: ciclo === 'cbu' ? 'CBU' : 'segundo', especialidad: curso.especialidad || '', año: parseInt(curso.curso), profesor: null, activa: true });
        await nuevaMateria.save();
        materiasIds.push(nuevaMateria._id);
      }
    }
  const nuevoUsuario = new Usuario({
    email,
    password,
    nombre,
    apellido,
    ...(dni && String(dni).trim() ? { dni: String(dni).trim() } : {}),
    rol,
    institucion: institucionIdToUse,
    institucionNombre: institucionActiva.nombre,
    especialidades: especialidades || [],
    ciclo,
    materias: materiasIds
  });
    await nuevoUsuario.save();
    // Decrementar usosRestantes sólo si existe; si no existe, inicializar campos para consistencia
    if (typeof codigo.usosRestantes === 'number') {
      codigo.usosRestantes = Math.max(0, codigo.usosRestantes - 1);
    } else {
      codigo.usosMaximos = codigo.usosMaximos || 1;
      codigo.usosRestantes = Math.max(0, (codigo.usosMaximos || 1) - 1);
    }
    // Si no existe el campo activo, asegurarlo
    if (typeof codigo.activo === 'undefined') codigo.activo = true;
    await codigo.save();
    if (materiasIds.length > 0) {
      const Materia = require('../models/Materia');
      await Materia.updateMany({ _id: { $in: materiasIds } }, { $set: { profesor: nuevoUsuario._id } });
    }
    res.status(201).json({ mensaje: 'Usuario creado exitosamente', usuario: { id: nuevoUsuario._id, nombre: nuevoUsuario.nombreCompleto, email: nuevoUsuario.email, rol: nuevoUsuario.rol, dni: nuevoUsuario.dni, materias: materiasIds } });
  } catch (error) {
    console.error('Error en registroUsuario:', error);
    // Si es un error de validación de Mongoose, devolver 400 con detalles
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Error de validación al guardar usuario', detalles: error.message });
    }
    // Manejar error de clave duplicada (por ejemplo email o dni único)
    if (error.code && error.code === 11000) {
      const dupField = Object.keys(error.keyValue || {})[0] || 'campo';
      // Si el duplicado es email, es probable que exista un índice único antiguo en la base de datos.
      if (dupField === 'email') {
        return res.status(500).json({
          error: 'Índice único en email bloquea el registro',
          detalles: 'El sistema ahora usa DNI como identificador único. Existe un índice único en la colección (email) en la base de datos que impide registros con emails duplicados. Ejecutá el script de mantenimiento `scripts/remove_unique_email_index.js` para eliminar dicho índice, o contactá al administrador para remover el índice único en la colección correspondiente.'
        });
      }
      // Para otros campos (por ejemplo dni o idEstudiante) devolvemos conflicto
      return res.status(409).json({ error: `Valor duplicado en ${dupField}`, detalles: error.keyValue });
    }
    res.status(500).json({ error: 'Error interno del servidor', detalles: error.message });
  }
};

exports.registroEstudiante = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Datos inválidos', detalles: errors.array() });
    }
    const { codigoInvitacion, ...estudianteData } = req.body;
    const codigo = await CodigoInvitacion.findOne({
      codigo: codigoInvitacion,
      $and: [
        { $or: [{ activo: true }, { activo: { $exists: false } }] },
        { $or: [{ usosRestantes: { $gt: 0 } }, { usosRestantes: { $exists: false } }] }
      ]
    });
    if (!codigo) return res.status(400).json({ error: 'Código de invitación inválido, expirado o agotado' });
    if (codigo.fechaExpiracion && codigo.fechaExpiracion < new Date()) return res.status(400).json({ error: 'El código de invitación ha expirado' });
    if (codigo.rol !== 'estudiante') return res.status(400).json({ error: `Este código es para registro de ${codigo.rol}, no para estudiante` });
    const institucionExiste = await Institucion.findById(estudianteData.institucion);
    if (!institucionExiste) return res.status(400).json({ error: 'La institución especificada no existe' });
    // Log de entrada
    console.log('registroEstudiante: payload recibido:', JSON.stringify(estudianteData));
    // Validar duplicados por idEstudiante y dni (email ya no es único)
    const estudianteExistenteId = await Estudiante.findOne({ idEstudiante: estudianteData.idEstudiante });
    const estudianteExistenteDni = await Estudiante.findOne({ dni: estudianteData.dni });
    if (estudianteExistenteId) {
      console.log('registroEstudiante: conflicto por idEstudiante:', estudianteData.idEstudiante);
      return res.status(409).json({ error: 'Ya existe un estudiante con ese idEstudiante', detalles: { idEstudiante: estudianteData.idEstudiante } });
    }
    if (estudianteExistenteDni) {
      console.log('registroEstudiante: conflicto por dni:', estudianteData.dni);
      return res.status(409).json({ error: 'Ya existe un estudiante con ese DNI', detalles: { dni: estudianteData.dni } });
    }

    // Intentar guardar con reintentos si hay colisiones en idEstudiante
    let nuevoEstudiante;
    const MAX_SAVE_ATTEMPTS_E = 6;
    let attemptE = 0;
    let lastErrE = null;
    // Si no vienen idEstudiante desde el cliente, preferimos generar uno derivado del DNI
    // (garantiza unicidad mientras el índice de dni exista). Si no hay DNI, caemos
    // al esquema por año+secuencia.
    if (!estudianteData.idEstudiante) {
      if (estudianteData.dni && String(estudianteData.dni).trim()) {
        estudianteData.idEstudiante = `EST${String(estudianteData.dni).trim()}`;
      } else {
        const yc = new Date().getFullYear();
        let seqc = await Estudiante.countDocuments({ cicloAcademico: yc, institucion: institucionExiste._id });
        seqc = seqc + 1;
        estudianteData.idEstudiante = `${yc}${String(seqc).padStart(4,'0')}`;
      }
    }

    while (attemptE < MAX_SAVE_ATTEMPTS_E) {
      try {
  // Log para depuración: id que intentamos usar
  console.log('registroEstudiante: intentando guardar con idEstudiante=', estudianteData.idEstudiante);
  // Asegurar que numeroEstudiante no sea null (hay un índice único histórico en la BD)
  if (!estudianteData.numeroEstudiante) estudianteData.numeroEstudiante = estudianteData.idEstudiante;
  nuevoEstudiante = new Estudiante({ ...estudianteData, fechaIngreso: new Date(), estadoAcademico: 'activo' });
        await nuevoEstudiante.save();
        lastErrE = null;
        break;
      } catch (errE) {
        lastErrE = errE;
        if (errE && errE.code === 11000) {
          const dupFieldRaw = Object.keys(errE.keyValue || {})[0] || '';
          if (dupFieldRaw === 'numeroEstudiante') {
            // Mapear y cambiar id
            if (attemptE < 3 && estudianteData.idEstudiante && estudianteData.idEstudiante.match(/^\d{8}$/)) {
              // incrementar secuencia simple
              const num = parseInt(estudianteData.idEstudiante.slice(-4),10) || 0;
              const prefix = estudianteData.idEstudiante.slice(0,4);
              estudianteData.idEstudiante = `${prefix}${String(num+1).padStart(4,'0')}`;
            } else if (estudianteData.dni) {
              estudianteData.idEstudiante = `EST${String(estudianteData.dni).trim()}`;
              if (attemptE > 3) estudianteData.idEstudiante = `EST${String(estudianteData.dni).trim()}-${Date.now()}`;
            } else {
              estudianteData.idEstudiante = `EST${Date.now()}`;
            }
          } else {
            // si la colisión es sobre idEstudiante u otro campo, intentamos modificar idEstudiante
            if (attemptE < 3) {
              // intentar sufijo numérico
              estudianteData.idEstudiante = estudianteData.idEstudiante.replace(/(\d+)$/, (m) => String(parseInt(m,10)+1).padStart(m.length,'0'));
            } else if (estudianteData.dni) {
              estudianteData.idEstudiante = `EST${String(estudianteData.dni).trim()}`;
              if (attemptE > 3) estudianteData.idEstudiante = `EST${String(estudianteData.dni).trim()}-${Date.now()}`;
            } else {
              estudianteData.idEstudiante = `EST${Date.now()}`;
            }
          }
        } else {
          // Error distinto: rethrow
          throw errE;
        }
      }
      attemptE += 1;
    }

    if (lastErrE) {
      console.error('No se pudo guardar estudiante tras reintentos:', lastErrE);
      if (lastErrE.code === 11000) {
        const rawField = Object.keys(lastErrE.keyValue || {})[0] || 'campo';
        const mappedField = rawField === 'numeroEstudiante' ? 'idEstudiante' : rawField;
        return res.status(409).json({ error: `Valor duplicado en ${mappedField}`, detalles: lastErrE.keyValue });
      }
      return res.status(500).json({ error: 'No se pudo crear el estudiante', detalles: lastErrE.message });
    }
    if (typeof codigo.usosRestantes === 'number') {
      codigo.usosRestantes = Math.max(0, codigo.usosRestantes - 1);
    } else {
      codigo.usosMaximos = codigo.usosMaximos || 1;
      codigo.usosRestantes = Math.max(0, (codigo.usosMaximos || 1) - 1);
    }
    if (typeof codigo.activo === 'undefined') codigo.activo = true;
    await codigo.save();
    res.status(201).json({ mensaje: 'Estudiante registrado exitosamente', estudiante: { id: nuevoEstudiante._id, nombre: nuevoEstudiante.nombreCompleto, idEstudiante: nuevoEstudiante.idEstudiante, email: nuevoEstudiante.email, especialidad: nuevoEstudiante.especialidad, año: nuevoEstudiante.año } });
  } catch (error) {
    console.error('Error en registroEstudiante:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Error de validación al guardar estudiante', detalles: error.message });
    }
    res.status(500).json({ error: 'Error interno del servidor', detalles: error.message });
  }
};
