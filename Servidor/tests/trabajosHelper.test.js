const { validateTrabajoBusinessRules, checkProfesorAsignado } = require('../helpers/trabajosHelper');
const Usuario = require('../models/Usuario');

jest.mock('../models/Usuario');

describe('validateTrabajoBusinessRules', () => {
  test('CBU acepta curso 2 y division B', () => {
    const r = validateTrabajoBusinessRules({ ciclo: 'CBU', curso: 2, division: 'b' });
    expect(r.ok).toBe(true);
    expect(r.normalized.especialidad).toBe('CBU');
    expect(r.normalized.division).toBe('B');
  });

  test('CBU rechaza curso 4', () => {
    const r = validateTrabajoBusinessRules({ ciclo: 'CBU', curso: 4 });
    expect(r.ok).toBe(false);
    expect(r.status).toBe(400);
  });

  test('segundo ciclo curso 5 division A -> Electricidad', () => {
    const r = validateTrabajoBusinessRules({ ciclo: 'segundo', curso: 5, division: 'A' });
    expect(r.ok).toBe(true);
    expect(r.normalized.especialidad).toBe('Electricidad');
  });

  test('segundo ciclo rechaza division C', () => {
    const r = validateTrabajoBusinessRules({ ciclo: 'segundo', curso: 6, division: 'C' });
    expect(r.ok).toBe(false);
  });
});

describe('checkProfesorAsignado', () => {
  afterEach(() => jest.resetAllMocks());

  test('administrador autoriza', async () => {
    Usuario.findById.mockResolvedValue({ _id: 'u1', rol: 'administrador' });
    const ok = await checkProfesorAsignado('u1', { materiaId: 'm1' });
    expect(ok).toBe(true);
  });

  test('profesor con materia en lista autoriza', async () => {
    Usuario.findById.mockResolvedValue({ _id: 'u2', rol: 'profesor', materias: ['m1','m2'] });
    const ok = await checkProfesorAsignado('u2', { materiaId: 'm1' });
    expect(ok).toBe(true);
  });

  test('profesor con cursosACargo autoriza por curso/division', async () => {
    Usuario.findById.mockResolvedValue({
      _id: 'u3', rol: 'profesor', cursosACargo: [
        { especialidad: 'Electricidad', cursos: [{ curso: 5, division: 'A' }], cicloAcademico: 2025 }
      ]
    });
    const ok = await checkProfesorAsignado('u3', { curso: 5, division: 'A', especialidad: 'Electricidad' });
    expect(ok).toBe(true);
  });

  test('profesor no asignado no autoriza', async () => {
    Usuario.findById.mockResolvedValue({ _id: 'u4', rol: 'profesor', materias: [] });
    const ok = await checkProfesorAsignado('u4', { materiaId: 'mX', curso: 2 });
    expect(ok).toBe(false);
  });
});
