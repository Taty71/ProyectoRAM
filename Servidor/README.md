# R.A.M. Server - Reforzar, Aprender, Mejorar

Servidor backend para la aplicación R.A.M., una herramienta digital de autoevaluación estudiantil específicamente diseñada para **Escuela Técnica Provincial** con estructura CBU + Especialidades.

## Descripción del Proyecto

R.A.M. (Reforzar, Aprender, Mejorar) es una aplicación web interactiva que permite a los estudiantes realizar autoevaluaciones tras instancias evaluativas, promoviendo la reflexión sobre su proceso de aprendizaje y generando datos para mejorar las estrategias didácticas.

### Estructura Educativa de la Escuela

**Ciclo Básico Unificado (CBU)**

- 1° Año - Formación básica común
- 2° Año - Formación básica común
- 3° Año - Formación básica + Introducción a especialidades

**Especialidades Técnicas**

- **Técnico en Electricidad** (4°, 5°, 6° año)
  - Circuitos eléctricos, electrónica, instalaciones
  - Máquinas eléctricas, automatización industrial
- **Técnico en Programación** (4°, 5°, 6° año)
  - Algoritmos, estructuras de datos, bases de datos
  - Desarrollo web, ingeniería de software

### Objetivos Específicos

- Diseñar una herramienta digital amigable para registrar experiencias de aprendizaje
- Promover la reflexión individual sobre procesos de estudio y comprensión
- Sistematizar percepciones estudiantiles sobre dificultades en materias y contenidos
- Analizar datos para identificar patrones y orientar mejoras didácticas
- Evaluar el impacto en procesos de enseñanza y acompañamiento pedagógico

## Sistema de Control de Acceso

### Roles y Permisos

**Administradores**

- Gestión completa de la escuela
- Creación y gestión de usuarios (profesores, jefes de área)
- Registro y gestión de estudiantes
- Acceso a todos los reportes y estadísticas
- Configuración del sistema

**Profesores**

- Acceso a datos de sus materias
- Visualización de autoevaluaciones de sus estudiantes
- Reportes específicos de sus cursos

**Jefe de área**

- Acceso a datos de su especialidad
- Gestión de profesores de su área
- Reportes por especialidad
- Configuración escolar limitada

**Estudiantes**

- Acceso solo para realizar autoevaluaciones
- Visualización de sus propias autoevaluaciones históricas
- Pertenencia al ciclo académico actual

### Gestión de la Escuela

- Sistema unificado para la Escuela Técnica Provincial
- Control de acceso basado en roles dentro de la escuela
- Gestión de especialidades CBU, Electricidad y Programación
- Control de ciclos académicos
- Configuración personalizada de la escuela

## Características Principales

### Funcionalidades del Servidor

- **Sistema de Autenticación Dual**: Login separado para usuarios del sistema y estudiantes
- **Control de Acceso Basado en Roles**: Permisos granulares según el rol del usuario
- **Gestión Escolar Integral**: Administración completa de la escuela técnica
- **Autoevaluaciones Identificadas**: Sistema de seguimiento por estudiante (no anónimo)
- **Análisis de Datos Avanzado**: Generación de estadísticas y patrones de aprendizaje
- **Dashboard Personalizado**: Panel de control adaptado al rol del usuario
- **API RESTful Segura**: Endpoints protegidos con autenticación y autorización
- **Gestión de Ciclos Académicos**: Control de acceso por períodos educativos

### Modelos de Datos

- **Institución**: Datos y configuración de instituciones educativas
- **Usuario**: Gestión de administradores, profesores y jefes de área
- **Estudiante**: Registro y seguimiento de estudiantes por institución
- **Autoevaluación**: Registro identificado de experiencias de aprendizaje
- **Materia**: Gestión de materias por institución y profesor

## Instalación y Configuración

### Requisitos Previos

- Node.js (v16 o superior)
- MongoDB (v4.4 o superior)
- npm o yarn

### Instalación

1. Clonar el repositorio
2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Configurar variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Editar `.env` con las configuraciones específicas.

4. Iniciar la base de datos MongoDB

5. Ejecutar el servidor:

   ```bash
   # Desarrollo
   npm run dev

   # Producción
   npm start
   ```

## API Endpoints

### Autenticación

- `POST /api/auth/login/usuario` - Login de usuarios del sistema
- `POST /api/auth/login/estudiante` - Login de estudiantes
- `POST /api/auth/registro/usuario` - Registro de nuevos usuarios (solo administradores)
- `POST /api/auth/registro/estudiante` - Registro de nuevos estudiantes
- `GET /api/auth/verificar` - Verificación de token

### Gestión Institucional

- `GET /api/instituciones/` - Listar instituciones (administradores globales)
- `POST /api/instituciones/` - Crear institución (administradores globales)
- `GET /api/instituciones/mi-institucion` - Información de la institución actual
- `PUT /api/instituciones/mi-institucion/configuracion` - Actualizar configuración
- `GET /api/instituciones/mi-institucion/estadisticas` - Estadísticas institucionales

### Gestión de Usuarios

- `GET /api/usuarios/` - Listar usuarios de la institución
- `GET /api/usuarios/estudiantes` - Listar estudiantes de la institución
- `PUT /api/usuarios/:userId` - Actualizar usuario
- `PUT /api/usuarios/estudiantes/:estudianteId` - Actualizar estudiante
- `PATCH /api/usuarios/:userId/password` - Cambiar contraseña

### Autoevaluaciones

- `POST /api/evaluaciones` - Crear nueva autoevaluación (estudiantes)
- `GET /api/evaluaciones/estadisticas/materia/:materia` - Estadísticas por materia
- `GET /api/evaluaciones/tendencias/:materia` - Tendencias temporales

### Dashboard y Reportes

- `GET /api/dashboard/metricas` - Métricas generales
- `GET /api/dashboard/patrones` - Análisis de patrones de aprendizaje
- `GET /api/dashboard/alertas` - Alertas y recomendaciones
- `GET /api/reportes/especialidad/:especialidad` - Reportes por especialidad
- `GET /api/reportes/comparativo` - Reporte comparativo entre materias

## Flujo de Acceso

### 1. Administrador del Sistema

1. Login con credenciales administrativas
2. Gestión de la escuela y sus configuraciones
3. Registro de profesores y jefes de área
4. Registro masivo de estudiantes
5. Acceso a todos los reportes y estadísticas

### 2. Profesor

1. Login con credenciales proporcionadas por el administrador
2. Acceso a materias asignadas
3. Visualización de autoevaluaciones de sus estudiantes
4. Generación de reportes específicos

### 3. Estudiante

1. Login con número de estudiante y contraseña
2. Verificación de pertenencia al ciclo académico actual
3. Realización de autoevaluaciones post-evaluación
4. Consulta del historial personal

## Estructura de Autoevaluación

Los estudiantes evalúan:

- **Comprensión General**: ¿Qué tan bien entendí el tema?
- **Conocimiento Previo**: ¿Qué sabía antes de la evaluación?
- **Dificultad Percibida**: ¿Qué tan difícil me resultó?
- **Confianza en Respuestas**: ¿Qué tan seguro estoy de mis respuestas?

### Reflexiones Cualitativas

- ¿Qué me resultó más fácil?
- ¿Qué me resultó más difícil?
- ¿Qué aprendí nuevo?
- ¿Cómo puedo mejorar mi estudio?

## Tecnologías Utilizadas

- **Framework**: Express.js
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JSON Web Tokens (JWT)
- **Seguridad**: Helmet, CORS, Rate Limiting
- **Validación**: Express Validator
- **Logging**: Morgan

## Contribuir

Este proyecto está dirigido a mejorar la educación técnica secundaria. Las contribuciones son bienvenidas siguiendo las mejores prácticas de desarrollo.

## Licencia

ISC - Instituto de Educación Técnica

---

**R.A.M. - Reforzar, Aprender, Mejorar**  
_Transformando la evaluación en oportunidad de crecimiento_
