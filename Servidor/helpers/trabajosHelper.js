const Usuario = require('../models/Usuario');
const Materia = require('../models/Materia');

/**
 * Valida reglas de negocio para ciclo/curso/división/especialidad.
 * - Para ciclo CBU: cursos 1-3, divisiones válidas A/B/C y especialidad fija 'CBU'
 * - Para ciclo 'segundo': cursos 4-7, especialidades típicas 'Electricidad' o 'Programación'
 *   y división A -> Electricidad, B -> Programación (según convenciones solicitadas)
 * @param {{ciclo:string, curso:number, division?:string, especialidad?:string}} params
 * @returns {{ok:boolean, status?:number, message?:string, normalized?:{division?:string, especialidad?:string}}}
 */
function validateTrabajoBusinessRules({ ciclo, curso, division, especialidad }) {
  const res = { ok: true, normalized: {} };
  if (!ciclo) return { ok: false, status: 400, message: 'Ciclo es requerido' };
  const cicloNorm = String(ciclo).trim();
  const cursoNum = Number(curso);
  if (!cursoNum || isNaN(cursoNum) || cursoNum < 1 || cursoNum > 7) return { ok: false, status: 400, message: 'Curso inválido' };

  const divRaw = division ? String(division).trim().toUpperCase() : '';

  if (cicloNorm === 'CBU') {
    // Primer ciclo: cursos 1-3 con divisiones A/B/C
    if (cursoNum < 1 || cursoNum > 3) return { ok: false, status: 400, message: 'Curso inválido para ciclo CBU (debe ser 1-3)' };
    const allowed = ['A','B','C'];
    if (divRaw && !allowed.includes(divRaw)) return { ok: false, status: 400, message: `División inválida para CBU. Opciones: ${allowed.join(', ')}` };
    // para CBU la especialidad es 'CBU'
    res.normalized.especialidad = 'CBU';
    if (divRaw) res.normalized.division = divRaw;
    return res;
  }

  if (cicloNorm === 'segundo') {
    // Segundo ciclo: cursos 4-7 con divisiones A (Electricidad) y B (Programación)
    if (cursoNum < 4 || cursoNum > 7) return { ok: false, status: 400, message: 'Curso inválido para ciclo segundo (debe ser 4-7)' };
    const allowed = ['A','B'];
    if (divRaw && !allowed.includes(divRaw)) return { ok: false, status: 400, message: `División inválida para ciclo segundo. Opciones: ${allowed.join(', ')}` };
    // si division presente, mapear a especialidad si no viene
    if (divRaw === 'A') res.normalized.especialidad = 'Electricidad';
    if (divRaw === 'B') res.normalized.especialidad = 'Programación';
    if (!especialidad && res.normalized.especialidad) {
      // rellenar la especialidad sugerida
    }
    if (divRaw) res.normalized.division = divRaw;
    return res;
  }

  return { ok: false, status: 400, message: 'Ciclo desconocido' };
}

/**
 * Comprueba si un profesor (usuarioId) está autorizado para crear/editar un trabajo
 * Verifica: administrador OR materia en usuario.materias OR cursosACargo coincidente
 * @returns {Promise<boolean>} true si autorizado
 */
async function checkProfesorAsignado(usuarioId, { materiaId, curso, division, especialidad }) {
  if (!usuarioId) return false;
  const usuario = await Usuario.findById(usuarioId).lean();
  if (!usuario) return false;

  if (usuario.rol === 'administrador') return true;

  // If a materiaId is provided, check the Materia document's profesor field first
  if (materiaId) {
    try {
      const materia = await Materia.findById(materiaId).lean();
      if (materia && materia.profesor && String(materia.profesor) === String(usuarioId)) return true;
    } catch (e) {
      // ignore lookup errors and continue with other checks
    }
  }

  // materia en lista de materias
  if (Array.isArray(usuario.materias) && usuario.materias.some(m => String(m) === String(materiaId))) return true;

  // cursosACargo
  if (Array.isArray(usuario.cursosACargo)) {
    for (const ca of usuario.cursosACargo) {
      if (!ca || !Array.isArray(ca.cursos)) continue;
      // si se envió especialidad, bóscar coincidencia (case-insensitive)
      if (especialidad && String(ca.especialidad).toLowerCase() !== String(especialidad).toLowerCase()) continue;
      for (const cc of ca.cursos) {
        if (!cc) continue;
        if (Number(cc.curso) === Number(curso)) {
          // division puede no estar presente en la verificación
          if (!division || String(cc.division) === String(division)) return true;
        }
      }
    }
  }

  return false;
}

module.exports = { checkProfesorAsignado };

module.exports.validateTrabajoBusinessRules = validateTrabajoBusinessRules;
