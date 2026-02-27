# WorkMinder Backend

API REST para la aplicación móvil WorkMinder - Sistema de gestión de tareas académicas con priorización inteligente.

## Tecnologías

- **Framework:** Next.js 16 con TypeScript
- **Base de datos:** MySQL 8.0
- **ORM:** mysql2
- **Autenticación:** JWT
- **Contenedores:** Docker

## Algoritmo de Priorización
```
P(t) = α·I(t) + β·U(t)

Donde:
- I(t) = Importancia = peso_calificacion / 100
- U(t) = Urgencia = 1 - (dias_restantes / 30)
- α = 0.6 (peso de importancia)
- β = 0.4 (peso de urgencia)
```

## Instalación
```bash
# Clonar repositorio
git clone https://github.com/fer-duran06/WorkMinder-Back.git
cd WorkMinder-Back

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Levantar MySQL con Docker
docker-compose up -d

# Ejecutar en desarrollo
npm run dev
```

## Base de Datos

El proyecto incluye:
- 5 tablas principales (usuarios, periodos_academicos, materias, tareas, subtareas)
- Vista `vw_tareas_priorizadas` con cálculo automático de prioridad
- Datos de prueba para desarrollo

## Endpoints

POST   /api/auth/register
POST   /api/auth/login
GET    /api/tasks
GET    /api/tasks/prioritized  ⭐ Lista priorizada
GET    /api/tasks/[id]
POST   /api/tasks
PUT    /api/tasks/[id]
DELETE /api/tasks/[id]


## Equipo

- **Fernando Duran** - Backend
- **Moisés** - QA
- **Ayelen** - Frontend

## Licencia

Proyecto académico - Universidad Politécnica de Chiapas