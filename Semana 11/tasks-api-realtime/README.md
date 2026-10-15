# tasks-api (tiempo real)

Demo del curso **Diseño de Software**: una Web API en Node.js (Express 5) organizada por capas que usa **Supabase** como base de datos, documentada con Swagger (OpenAPI 3.1).

**Semana 11:** esta copia agrega notificaciones en tiempo real con **Server-Sent Events**. Cada vez que se crea, edita o borra una tarea, el servicio emite un evento y todos los navegadores conectados lo reciben.

- `GET /api/tasks/stream`: stream SSE (`curl -N localhost:3000/api/tasks/stream`)
- `http://localhost:3000/live.html`: página que muestra los eventos en vivo
- Archivos nuevos o cambiados: `src/lib/events.js`, `tasks.service.js`, `tasks.controller.js`, `tasks.routes.js`, `src/app.js`, `public/live.html`
- Guion del taller: [`../Taller - Tiempo real con SSE.md`](../Taller%20-%20Tiempo%20real%20con%20SSE.md)

> El guion de la Semana 9 (API base) está en [TUTORIAL.md](./TUTORIAL.md).

## Requisitos

- Node.js 20.6 o superior (usa `--env-file` y `--watch`, así que no hacen falta `dotenv` ni `nodemon`)
- Un proyecto en [Supabase](https://supabase.com)

## Puesta en marcha

1. En Supabase → **SQL Editor**, ejecutar `supabase/01_tasks.sql`.
2. Copiar `.env.example` a `.env` y completar `SUPABASE_URL` y `SUPABASE_SECRET_KEY` (Project Settings → API Keys). La secret key solo se usa en el servidor: la base de datos queda cerrada y la API es la única puerta de entrada.
3. Instalar y levantar:

```bash
npm install
npm run dev
```

4. Abrir la documentación interactiva en **http://localhost:3000/api/docs** (o usar `requests.http` con la extensión REST Client).

## Estructura

```
src/
├── server.js                 # Arranca el servidor HTTP (solo eso)
├── app.js                    # Construye la app: middlewares, rutas y manejo de errores
├── routes.js                 # Monta los módulos bajo /api
├── config/env.js             # Lee y valida variables de entorno (zod)
├── lib/supabase.js           # Cliente de Supabase
├── docs/                     # Swagger: helpers, openapi.js (junta los módulos), docs.routes.js
├── middlewares/              # validate, not-found, error-handler
├── utils/http-error.js       # Error con código HTTP
└── modules/
    ├── health/               # GET /api/health, GET /api/health/db (+ health.docs.js)
    └── tasks/
        ├── tasks.routes.js       # Rutas + composición de dependencias
        ├── tasks.controller.js   # HTTP  ->  servicio
        ├── tasks.service.js      # Reglas de negocio
        ├── tasks.repository.js   # Acceso a datos (único que conoce Supabase)
        ├── tasks.schema.js       # Schemas zod: validan la entrada y generan la doc
        └── tasks.docs.js         # Documentación OpenAPI del módulo
supabase/
├── 01_tasks.sql              # Tabla tasks + datos de ejemplo
└── 02_auth.sql               # Paso 7: tabla users (email + hash bcrypt)
```

## Endpoints

| Método | Ruta              | Descripción                         |
|--------|-------------------|-------------------------------------|
| GET    | `/api/docs`       | Swagger UI                          |
| GET    | `/api/docs/openapi.json` | Especificación OpenAPI (JSON) |
| GET    | `/api/health`     | La API está viva                    |
| GET    | `/api/health/db`  | La API llega a Supabase             |
| GET    | `/api/tasks`      | Listar tareas                       |
| GET    | `/api/tasks/:id`  | Obtener una tarea                   |
| POST   | `/api/tasks`      | Crear (`title`, `description?`, `done?`) |
| PATCH  | `/api/tasks/:id`  | Actualizar parcialmente             |
| DELETE | `/api/tasks/:id`  | Eliminar                            |

Errores siempre con la forma `{ "error": { "message": "...", "details": [...] } }`.
