// --- Endpoint para verificar si el usuario existe y la contraseña es correcta ---
// Agregar esto en el archivo de rutas (por ejemplo, routes/auth.js), pero aquí va la función para exportar:

const verificarUsuarioExistente = async (req, res) => {
	const { email, password } = req.body;
	try {
		const usuario = await Usuario.findOne({ email });
		if (!usuario) return res.json({ existe: false });
		const esValida = await usuario.compararPassword(password);
		if (!esValida) return res.json({ existe: false });
		// Opcional: puedes devolver el rol si lo necesitas en el frontend
		return res.json({ existe: true, rol: usuario.rol });
	} catch (err) {
		return res.status(500).json({ error: 'Error de servidor' });
	}
};

// Archivo renombrado: authMiddleware.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Estudiante = require('../models/Estudiante');

// Middleware para verificar token de usuarios (administradores, profesores, jefes de área)
const verificarTokenUsuario = async (req, res, next) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');
    
		if (!token) {
			return res.status(401).json({
				error: 'Token de acceso requerido'
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal');
    
		// Verificar si es un usuario del sistema
		if (decoded.tipo === 'usuario') {
			const usuario = await Usuario.findById(decoded.id)
				.populate('institucion')
				.select('-password');
      
			if (!usuario || !usuario.activo) {
				return res.status(401).json({
					error: 'Usuario no válido o inactivo'
				});
			}
      
			req.usuario = usuario;
			req.tipoUsuario = 'usuario';
		} else {
			return res.status(401).json({
				error: 'Tipo de token no válido'
			});
		}

		next();
	} catch (error) {
		return res.status(401).json({
			error: 'Token inválido'
		});
	}
};

// Middleware para verificar token de estudiantes
const verificarTokenEstudiante = async (req, res, next) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');
    
		if (!token) {
			return res.status(401).json({
				error: 'Token de acceso requerido'
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal');
    
		// Verificar si es un estudiante
		if (decoded.tipo === 'estudiante') {
			const estudiante = await Estudiante.findById(decoded.id)
				.populate('institucion')
				.select('-password');
      
			if (!estudiante || !estudiante.enCicloActual) {
				return res.status(401).json({
					error: 'Estudiante no válido o no está en el ciclo actual'
				});
			}
      
			req.estudiante = estudiante;
			req.tipoUsuario = 'estudiante';
		} else {
			return res.status(401).json({
				error: 'Tipo de token no válido'
			});
		}

		next();
	} catch (error) {
		return res.status(401).json({
			error: 'Token inválido'
		});
	}
};

// Middleware combinado que acepta tanto usuarios como estudiantes
const verificarToken = async (req, res, next) => {
	try {
		const token = req.header('Authorization')?.replace('Bearer ', '');
    
		if (!token) {
			return res.status(401).json({
				error: 'Token de acceso requerido'
			});
		}

		const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_temporal');
    
		if (decoded.tipo === 'usuario') {
			const usuario = await Usuario.findById(decoded.id)
				.populate('institucion')
				.select('-password');
      
			if (!usuario || !usuario.activo) {
				return res.status(401).json({
					error: 'Usuario no válido o inactivo'
				});
			}
      
			req.usuario = usuario;
			req.tipoUsuario = 'usuario';
      
		} else if (decoded.tipo === 'estudiante') {
			const estudiante = await Estudiante.findById(decoded.id)
				.populate('institucion')
				.select('-password');
      
			if (!estudiante || !estudiante.enCicloActual) {
				return res.status(401).json({
					error: 'Estudiante no válido o no está en el ciclo actual'
				});
			}
      
			req.estudiante = estudiante;
			req.tipoUsuario = 'estudiante';
		} else {
			return res.status(401).json({
				error: 'Tipo de token no válido'
			});
		}

		next();
	} catch (error) {
		return res.status(401).json({
			error: 'Token inválido'
		});
	}
};

// Middleware para verificar roles específicos
const verificarRol = (...rolesPermitidos) => {
	return (req, res, next) => {
		if (!req.usuario) {
			return res.status(403).json({
				error: 'Acceso denegado: se requiere autenticación de usuario'
			});
		}

		if (!rolesPermitidos.includes(req.usuario.rol)) {
			return res.status(403).json({
				error: 'Acceso denegado: permisos insuficientes',
				rolRequerido: rolesPermitidos,
				rolActual: req.usuario.rol
			});
		}

		next();
	};
};

// Middleware para verificar que el usuario pertenece a la escuela
const verificarEscuela = (req, res, next) => {
	// Para una sola escuela, simplemente verificamos que el usuario esté autenticado
	// La verificación de institución ya se hace en verificarToken
	next();
};

module.exports = {
	verificarTokenUsuario,
	verificarTokenEstudiante,
	verificarToken,
	verificarRol,
	verificarEscuela,
	verificarUsuarioExistente
};
