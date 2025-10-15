# Guía de Instalación R.A.M. - Escuela Técnica Provincial

## 🚀 Instalación Rápida

### 1. Preparar el Entorno

```bash
# Navegar al directorio del servidor
cd "d:\ProyectoRAM\Servidor"

# Instalar dependencias
npm install
```

### 2. Configurar Base de Datos

```bash
# Asegúrate de tener MongoDB ejecutándose
# Luego copia el archivo de configuración
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/ram_database
JWT_SECRET=tu_clave_secreta_muy_segura
NODE_ENV=development
```

### 3. Inicializar el Sistema

```bash
# Crear la estructura básica y administrador
npm run init

# Poblar con datos de ejemplo
npm run datos
```

### 4. Ejecutar la Aplicación

```bash
# Modo desarrollo (recomendado)
npm run dev

# Modo producción
npm start
```

## 🎯 Estructura del Sistema Configurado

### 📚 CBU (Ciclo Básico Unificado)

- **1° Año**: 10 estudiantes (CBU1001-CBU1010)
- **2° Año**: 10 estudiantes (CBU2001-CBU2010)
- **3° Año**: 10 estudiantes (CBU3001-CBU3010)

### ⚡ Técnico en Electricidad

- **4° Año**: 8 estudiantes (ELE4001-ELE4008)
- **5° Año**: 8 estudiantes (ELE5001-ELE5008)
- **6° Año**: 8 estudiantes (ELE6001-ELE6008)

### 💻 Técnico en Programación

- **4° Año**: 8 estudiantes (PRG4001-PRG4008)
- **5° Año**: 8 estudiantes (PRG5001-PRG5008)
- **6° Año**: 8 estudiantes (PRG6001-PRG6008)

**Total**: 70 estudiantes

## 🔑 Credenciales de Acceso

### Administrador Principal

- **Email**: admin@ram.edu.ar
- **Contraseña**: admin123

### Jefes de Área por Especialidad

- **CBU**: coord.cbu@escuela.edu.ar (coord123)
- **Electricidad**: coord.electricidad@escuela.edu.ar (coord123)
- **Programación**: coord.programacion@escuela.edu.ar (coord123)

### Profesores Ejemplo

- **Matemática**: prof.matematica@escuela.edu.ar (prof123)
- **Lengua**: prof.lengua@escuela.edu.ar (prof123)
- **Física**: prof.fisica@escuela.edu.ar (prof123)
- **Electrónica**: prof.electronica@escuela.edu.ar (prof123)
- **Algoritmos**: prof.algoritmos@escuela.edu.ar (prof123)
- **Base de Datos**: prof.base_datos@escuela.edu.ar (prof123)

### Estudiantes

- **Formato**: CBU1001, ELE4001, PRG4001, etc.
- **Contraseña**: est123

## 📊 Endpoints Principales

### Información de la Escuela

- `GET /api/escuela/estructura` - Estructura completa CBU + Especialidades
- `GET /api/escuela/año/1` - Información específica de 1° año
- `GET /api/escuela/año/4` - Información de 4° año (ambas especialidades)

### Autenticación

- `POST /api/auth/login/usuario` - Login profesores/jefes de área
- `POST /api/auth/login/estudiante` - Login estudiantes

### Gestión

- `GET /api/usuarios/estudiantes` - Lista de estudiantes
- `GET /api/materias/` - Materias por especialidad
- `GET /api/dashboard/metricas` - Métricas generales

## 📝 Flujo de Trabajo Típico

### Para Jefes de Área/Profesores:

1. Login con credenciales de usuario
2. Acceder al dashboard de su área
3. Ver autoevaluaciones de estudiantes
4. Generar reportes por materia/año

### Para Estudiantes:

1. Login con número de estudiante
2. Realizar autoevaluaciones post-evaluación
3. Consultar historial personal

## 🛠️ Comandos Útiles

```bash
# Reinicializar datos (borra todo y recrea)
npm run init
npm run datos

# Solo agregar datos de ejemplo (mantiene existentes)
npm run datos

# Ver logs en desarrollo
npm run dev

# Verificar estructura de la base de datos
# (usar MongoDB Compass o mongo shell)
```

## 🔧 Solución de Problemas

### MongoDB no conecta

```bash
# Verificar que MongoDB esté ejecutándose
mongod --version

# Si no está instalado, instalar MongoDB Community
```

### Puerto en uso

```bash
# Cambiar puerto en .env
PORT=3001
```

### Datos corruptos

```bash
# Eliminar base de datos y reinicializar
# En mongo shell:
# use ram_database
# db.dropDatabase()

# Luego ejecutar:
npm run init
npm run datos
```

## 📞 Soporte

Para problemas específicos de la implementación, verificar:

1. Logs del servidor en la consola
2. Estado de la conexión MongoDB
3. Configuración del archivo `.env`
4. Permisos de archivos y carpetas

---

**R.A.M. - Escuela Técnica Provincial**  
_Sistema de Autoevaluación Estudiantil_
