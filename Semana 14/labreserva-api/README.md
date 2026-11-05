# LabReserva API

Sistema para reservar los laboratorios de la escuela. Lo desarrolló un equipo externo con prisa y **sale a producción la próxima semana**. Antes de eso, la dirección les pidió a ustedes una auditoría de seguridad.

> ⚠️ **Este proyecto es inseguro a propósito.** Úselo solo en su computadora, para la actividad del curso. No lo despliegue en internet.

## Puesta en marcha

Requiere **Node.js 22.13 o superior** (usa SQLite incluido en Node, no hay que instalar ninguna base de datos).

```bash
npm install
npm run dev
```

- Frontend: <http://localhost:3000>
- API: <http://localhost:3000/api>

La base de datos vive **en memoria**: cada vez que el servidor se reinicia, vuelve a los datos iniciales. Si rompe algo, reinicie.

## Cuenta de prueba

La dirección le entregó **una sola cuenta**, de estudiante:

| Email | Contraseña | Rol |
|---|---|---|
| `ana@labreserva.test` | `ana12345` | estudiante |

## Roles

| Rol | Puede |
|---|---|
| `estudiante` | Ver laboratorios, comentar, crear y cancelar **sus** reservas, editar **su** perfil |
| `profesor` | Lo mismo, y consultar el directorio de usuarios |
| `admin` | Todo: crear laboratorios, ver todas las reservas, eliminar usuarios |

## Endpoints

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| GET | `/api/health` | | Estado del servidor |
| POST | `/api/auth/register` | | Registro (`name`, `email`, `password`, `carnet?`) |
| POST | `/api/auth/login` | | Login → `{ token, user }` |
| GET | `/api/users` | ✅ | Directorio de usuarios (para profesores) |
| GET | `/api/users/me` | ✅ | Mi perfil |
| PATCH | `/api/users/me` | ✅ | Editar mi perfil (`name`, `phone`, `carnet`) |
| GET | `/api/labs?search=` | | Laboratorios, con búsqueda por nombre o edificio |
| GET | `/api/labs/:id` | | Un laboratorio, con sus comentarios |
| POST | `/api/labs/:id/comments` | ✅ | Comentar (`body`) |
| GET | `/api/reservations` | ✅ | Mis reservas |
| GET | `/api/reservations/:id` | ✅ | Una reserva |
| POST | `/api/reservations` | ✅ | Reservar (`labId`, `date`, `startHour`, `endHour`, `purpose`) |
| DELETE | `/api/reservations/:id` | ✅ | Cancelar una reserva |
| GET | `/api/files?name=` | | Manuales de los laboratorios |
| GET | `/api/admin/reservations` | ✅ admin | Todas las reservas |
| POST | `/api/admin/labs` | ✅ admin | Crear laboratorio |
| DELETE | `/api/admin/users/:id` | ✅ admin | Eliminar usuario |

Las rutas con ✅ esperan el header `Authorization: Bearer <token>`.

## Estructura

```
src/
├── server.js            arranque
├── app.js               middlewares globales
├── routes.js            monta los módulos
├── config.js            configuración
├── db.js                esquema y datos iniciales (SQLite en memoria)
├── lib/                 jwt, contraseñas
├── middlewares/         auth, manejo de errores
└── modules/             auth, users, labs, reservations, files, admin, debug
public/                  frontend (HTML + JS sin frameworks)
files/manuales/          manuales que descarga /api/files
```

Ver `requests.http` para ejemplos listos (extensión **REST Client** de VS Code).
