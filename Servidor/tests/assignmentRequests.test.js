const request = require('supertest');
const express = require('express');

// We'll mount the router under test with mocked middleware and models
jest.mock('../models/AssignmentRequest');
jest.mock('../models/Materia');

const AssignmentRequest = require('../models/AssignmentRequest');
const Materia = require('../models/Materia');

// Mock auth middleware to inject a fake user
const mockVerificarToken = (req, res, next) => {
  req.usuario = { _id: 'prof-123', rol: 'profesor' };
  next();
};

describe('POST /api/materias/:id/assignment-requests', () => {
  let app;
  beforeAll(() => {
    app = express();
    app.use(express.json());
    // Replace the middleware used by the router
    const router = require('../routes/assignmentRequests');

    // monkey-patch local middleware requires inside the router file by overriding the module cache entry
    // Simpler: mount the router but override req.usuario via a global middleware before the router
    app.use((req, res, next) => { req.usuario = { _id: 'prof-123', rol: 'profesor' }; next(); });
    app.use('/api', router);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('creates a request when materia exists', async () => {
    Materia.findById = jest.fn().mockResolvedValue({ _id: 'mat-1', nombre: 'Mat A' });
    AssignmentRequest.mockImplementation(function (doc) { return { save: jest.fn().mockResolvedValue({ ...doc, _id: 'req-1' }) }; });

    const res = await request(app)
      .post('/api/materias/mat-1/assignment-requests')
      .send({ horarioPropuesto: 'Mañana', diasPropuestos: ['Lunes'] })
      .set('Accept', 'application/json');

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('mensaje');
    expect(Materia.findById).toHaveBeenCalledWith('mat-1');
  });

  test('returns 404 when materia not found', async () => {
    Materia.findById = jest.fn().mockResolvedValue(null);

    const res = await request(app)
      .post('/api/materias/doesnot/mat/assignment-requests')
      .send({ horarioPropuesto: 'Tarde' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });
});
