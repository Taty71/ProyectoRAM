const httpMocks = require('node-mocks-http');
const registroController = require('../controllers/registroController');
const loginController = require('../controllers/loginController');

// We'll require models and mock the methods we need inside each test to avoid
// interfering with other test suites that import the same modules.
const CodigoInvitacion = require('../models/CodigoInvitacion');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');
const Institucion = require('../models/Institucion');

describe('Registro y Login (controladores)', () => {
  afterEach(() => jest.resetAllMocks());

  test('registroUsuario crea Estudiante y retorna idEstudiante', async () => {
    // Mock del código
    CodigoInvitacion.findOne = jest.fn().mockResolvedValue({ codigo: 'ABC', rol: 'estudiante', usosRestantes: 1, fechaExpiracion: null, save: jest.fn() });
    // Institucion activa
    Institucion.findOne = jest.fn().mockResolvedValue({ _id: 'inst1', nombre: 'Inst Test', activa: true, ciclos: [], configuracion: {} });
    // No existe usuario por DNI
    Usuario.findOne = jest.fn().mockResolvedValue(null);
    // No existe estudiante por DNI
    Estudiante.findOne = jest.fn().mockResolvedValue(null);
    // Count documents para idEstudiante
    Estudiante.countDocuments = jest.fn().mockResolvedValue(0);
    // Guardar nuevo estudiante -> mock del save
    const fakeSave = jest.fn().mockResolvedValue(true);
    Estudiante.prototype.save = fakeSave;

    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/auth/registro/usuario',
      body: {
        nombre: 'Juan',
        apellido: 'Perez',
        dni: '12345678',
        email: 'juan@example.com',
        password: 'secret12',
        rol: 'estudiante',
        anio: 1,
        division: 'A',
        fechaNacimiento: '2008-05-01',
        codigoInvitacion: 'ABC'
      }
    });
    const res = httpMocks.createResponse();

    await registroController.registroUsuario(req, res);
    const data = res._getJSONData();
    expect(res.statusCode).toBe(201);
    expect(data).toHaveProperty('estudiante');
    expect(data.estudiante).toHaveProperty('idEstudiante');
  });

  test('loginUsuario por DNI retorna token y usuario', async () => {
    const fakeUsuario = {
      _id: 'u1',
      dni: '87654321',
      nombre: 'Ana',
      apellido: 'Gomez',
      nombreCompleto: 'Ana Gomez',
      email: 'ana@example.com',
      rol: 'profesor',
      activo: true,
      compararPassword: jest.fn().mockResolvedValue(true),
      save: jest.fn(),
      // Provide institucion populated to avoid controller calling populate()
      institucion: { _id: 'inst1', activa: true, nombre: 'Inst Test', codigo: 'IT' }
    };
  // Mock findOne to support chaining .populate('institucion') used in controller
  Usuario.findOne = jest.fn().mockReturnValue({ populate: jest.fn().mockResolvedValue(fakeUsuario) });
    Institucion.findById = jest.fn().mockResolvedValue({ _id: 'inst1', activa: true, nombre: 'Inst Test' });

    const req = httpMocks.createRequest({
      method: 'POST',
      url: '/api/auth/login/usuario',
      body: { dni: '87654321', password: 'pass123' }
    });
    const res = httpMocks.createResponse();

    await loginController.loginUsuario(req, res);
    const data = res._getJSONData();
    if (res.statusCode !== 200) {
      console.error('DEBUG loginUsuario response status:', res.statusCode, 'body:', res._getData && res._getData());
    }
    expect(res.statusCode).toBe(200);
    expect(data).toHaveProperty('token');
    expect(data).toHaveProperty('usuario');
    expect(data.usuario.dni).toBe('87654321');
  });

});
