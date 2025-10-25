const { checkProfesorAsignado } = require('../helpers/trabajosHelper');
const Usuario = require('../models/Usuario');

jest.mock('../models/Usuario');

describe('trabajosHelper.checkProfesorAsignado', () => {
  afterEach(() => jest.resetAllMocks());

  test('retorna false si usuario no existe', async () => {
    Usuario.findById = jest.fn().mockResolvedValue(null);
    const ok = await checkProfesorAsignado('nonexistent', { materiaId: 'm1', curso: 2 });
    expect(ok).toBe(false);
  });

  test('retorna true para administrador', async () => {
    Usuario.findById = jest.fn().mockResolvedValue({ _id: 'u1', rol: 'administrador' });
    const ok = await checkProfesorAsignado('u1', { materiaId: 'm1' });
    expect(ok).toBe(true);
  });

  test('retorna true si materia está en usuario.materias', async () => {
    Usuario.findById = jest.fn().mockResolvedValue({ _id: 'u2', rol: 'profesor', materias: ['m1','m2'] });
    const ok = await checkProfesorAsignado('u2', { materiaId: 'm1' });
    expect(ok).toBe(true);
  });

  test('retorna true si cursosACargo coincide con curso y division', async () => {
    Usuario.findById = jest.fn().mockResolvedValue({
      _id: 'u3',
      rol: 'profesor',
      cursosACargo: [{ especialidad: 'CBU', cursos: [{ curso: 2, division: 'A' }], cicloAcademico: 2025 }]
    });
    const ok = await checkProfesorAsignado('u3', { materiaId: 'x', curso: 2, division: 'A', especialidad: 'CBU' });
    expect(ok).toBe(true);
  });

  test('retorna false si no coincide ninguna regla', async () => {
    Usuario.findById = jest.fn().mockResolvedValue({ _id: 'u4', rol: 'profesor', materias: [], cursosACargo: [] });
    const ok = await checkProfesorAsignado('u4', { materiaId: 'm1', curso: 3 });
    expect(ok).toBe(false);
  });
});
