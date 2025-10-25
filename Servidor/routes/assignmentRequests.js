const express = require('express');
const router = express.Router();
const AssignmentRequest = require('../models/AssignmentRequest');
const Materia = require('../models/Materia');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// Profesor crea una solicitud de asignación a una materia
router.post('/materias/:id/assignment-requests', verificarToken, async (req, res) => {
  try {
    const materiaId = req.params.id;
    const profesorId = req.usuario._1d || req.usuario._id || req.usuario.id;
    const { horarioPropuesto, cargaHorariaPropuesta, diasPropuestos } = req.body;

    // Validate presence of either horario or dias
    const hasHorario = horarioPropuesto && String(horarioPropuesto).trim() !== '';
    const hasDias = Array.isArray(diasPropuestos) && diasPropuestos.length > 0;

    if (!hasHorario && !hasDias) {
      return res.status(400).json({ error: 'Se requiere horarioPropuesto o diasPropuestos' });
    }

    const materia = await Materia.findById(materiaId);
    if (!materia) return res.status(404).json({ error: 'Materia no encontrada' });

    // Si ya está asignada a otro profesor, crear igualmente la solicitud para revisión por admin

    const reqDoc = new AssignmentRequest({
      materia: materiaId,
      profesor: profesorId,
      requestedBy: profesorId,
      horarioPropuesto,
      cargaHorariaPropuesta,
      diasPropuestos: hasDias ? diasPropuestos : []
    });
    await reqDoc.save();

    return res.status(201).json({ mensaje: 'Solicitud creada', request: reqDoc });
  } catch (err) {
    console.error('Error creando assignment request', err);
    return res.status(500).json({ error: 'Error creando solicitud' });
  }
});

// Admin: listar solicitudes para una materia o todas
router.get('/materias/:id/assignment-requests', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const materiaId = req.params.id;
    const list = await AssignmentRequest.find({ materia: materiaId }).populate('profesor requestedBy');
    return res.json({ requests: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error listando solicitudes' });
  }
});

// Admin: listar todas las solicitudes (opcional filtro por estado)
router.get('/assignment-requests', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const { estado } = req.query;
    const filtro = {};
    if (estado) filtro.estado = estado;
    const list = await AssignmentRequest.find(filtro).populate('materia profesor requestedBy').sort({ createdAt: -1 });
    return res.json({ requests: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error listando solicitudes' });
  }
});

// Admin aprueba/rechaza solicitud
router.patch('/assignment-requests/:id', verificarToken, verificarRol('admin'), async (req, res) => {
  try {
    const id = req.params.id;
    const { estado, adminComentario } = req.body;
    const reqDoc = await AssignmentRequest.findById(id);
    if (!reqDoc) return res.status(404).json({ error: 'Solicitud no encontrada' });

    if (!['approved','rejected','pending'].includes(estado)) return res.status(400).json({ error: 'Estado inválido' });

    reqDoc.estado = estado;
    reqDoc.adminComentario = adminComentario;
    await reqDoc.save();

    if (estado === 'approved') {
      // Aplicar la asignación a la materia
      const materia = await Materia.findById(reqDoc.materia);
      if (materia) {
        materia.profesor = reqDoc.profesor;
        if (reqDoc.horarioPropuesto) {
          materia.cargaHoraria = materia.cargaHoraria || {};
          materia.cargaHoraria.horario = reqDoc.horarioPropuesto;
        }
        if (Array.isArray(reqDoc.diasPropuestos) && reqDoc.diasPropuestos.length) {
          materia.cargaHoraria = materia.cargaHoraria || {};
          materia.cargaHoraria.dias = reqDoc.diasPropuestos;
        }
        await materia.save();
      }
    }

    return res.json({ mensaje: 'Solicitud actualizada', request: reqDoc, materia: reqDoc.materia });
  } catch (err) {
    console.error('Error actualizando solicitud', err);
    return res.status(500).json({ error: 'Error actualizando solicitud' });
  }
});

module.exports = router;
