# Guion de la demo: Web API en Node + Supabase

**Objetivo de la clase:** construir en vivo una API REST bien estructurada, conectarla a una base de datos real en Supabase documentarla con Swagger (OpenAPI) y protegerla con autenticación por token (JWT). En el camino se usan los temas de las semanas anteriores: arquitectura en capas (S6), Repository, Factory e inyección de dependencias (S7), y se compara con NestJS (S8).

**Dominio:** una lista de tareas (`tasks`). Es simple a propósito, para que la atención esté en la estructura y no en el negocio.

**La historia de la clase:** primero la API es **abierta** y cualquiera que llame al endpoint obtiene las tareas. Al final la **cerramos**: sin `Authorization: Bearer <token>` en el header, la respuesta es `401`.

**Duración sugerida:** unas 2 h 15'. Se puede dividir en dos clases: **Parte A** (pasos 0–6) y **Parte B** (pasos 7–8).

| Paso | Tema                                     | Tiempo | Resultado visible                         |
|------|------------------------------------------|--------|-------------------------------------------|
| 0    | Qué vamos a construir                    | 5'     | Diagrama de capas                         |
| 1    | Crear la base de datos en Supabase       | 10'    | Tabla `tasks` con datos                   |
| 2    | Crear el proyecto Node                   | 15'    | `npm run dev` arranca (o falla con un error claro) |
| 3    | Primer endpoint: `/api/health`           | 10'    | `200 OK` en el navegador                  |
| 4    | Conectar a Supabase: primer GET          | 15'    | `GET /api/tasks` devuelve filas reales    |
| 5    | CRUD completo + validación               | 20'    | POST/PATCH/DELETE, errores 400/404 (**API abierta**) |
| 6    | Documentación con Swagger                | 15'    | `/api/docs` interactivo (**API abierta**) |
| 7    | Autenticación con JWT                    | 30'    | Sin token → `401`; con token → `200`      |
| 8    | Cierre y siguientes pasos                | 10'    | Lista de tareas para los estudiantes      |

---

## Antes de la clase (checklist)

- [ ] Node ≥ 20.6 instalado (`node -v`). VS Code con la extensión **REST Client** (para `requests.http`).
- [ ] Cuenta de Supabase lista. **Crear un proyecto de respaldo con anticipación**: el aprovisionamiento tarda 1–2 minutos y a veces más. En clase se crea uno en vivo para mostrar el proceso, pero si tarda, se usa el de respaldo.
- [ ] Tener el código final en una rama con **un commit por paso** (`git tag paso-1`, `paso-2`, …). Si algo se rompe en vivo: `git checkout paso-N` y se sigue adelante.
- [ ] Generar de antemano un `JWT_SECRET` para el paso 7 (comando en 7.1).
- [ ] Letra grande en la terminal y el editor. Cerrar notificaciones.

---

## Paso 0 — Qué vamos a construir (5')

Mostrar el diagrama y explicar que cada capa tiene **una sola responsabilidad**:

```
Cliente (REST Client / Postman / frontend)
        │  HTTP + JSON   (paso 7: + Authorization: Bearer <JWT>)
        ▼
┌──────────────────────────── Express ────────────────────────────┐
│ middlewares: cors · json · morgan · validate · (auth) · errores │
│                                                                 │
│  routes  ──►  controller  ──►  service  ──►  repository  ──────────►  Supabase
│ (URL→fn)     (HTTP↔datos)    (reglas)      (queries)            │     (Postgres)
└─────────────────────────────────────────────────────────────────┘
```

**Mensajes clave:**
- Si mañana cambiamos Supabase por otra base de datos, solo cambia el `repository`. Si cambiamos Express por otro framework, solo cambian `routes` y `controller`.
- **La API es la única puerta de entrada a los datos.** El cliente nunca habla directo con la base de datos. Por eso, en el paso 7, proteger la API es suficiente.

---

## Paso 1 — Crear la base de datos en Supabase (10')

1. supabase.com → **New project**. Elegir una región cercana y guardar la contraseña de la base de datos.
2. Mientras se aprovisiona, explicar qué es Supabase: Postgres administrado, más una API automática, Auth y Storage. **Nosotros solo vamos a usar el Postgres**, porque la API y la autenticación las construimos nosotros.
3. **SQL Editor** → pegar y ejecutar [`supabase/01_tasks.sql`](./supabase/01_tasks.sql). Recorrerlo línea por línea:
   - `generated always as identity`: el id lo pone la base de datos, no el cliente.
   - `check (...)`: la base de datos también valida. Es la última línea de defensa.
   - `enable row level security` **sin políticas**: la tabla queda cerrada para cualquiera que use la llave pública. Solo nuestro servidor, con la secret key, puede leerla y escribirla.
4. **Table Editor**: mostrar las 3 filas de ejemplo.
5. **Project Settings → API Keys**: copiar la *Project URL* y la **secret key** (`sb_secret_...`).
   - ⚠️ La secret key da acceso total a la base de datos. Vive **solo** en el servidor (`.env`): nunca va en git ni en un frontend.
   - Comparar con la *publishable key*, que es para apps que hablan directo con Supabase desde el navegador. No es nuestro caso.

✅ **Checkpoint:** la tabla existe con datos y tenemos la URL y la secret key.

---

## Paso 2 — Crear el proyecto Node (15')

```bash
mkdir tasks-api && cd tasks-api
npm init -y
npm i express @supabase/supabase-js zod cors morgan
```

1. En `package.json` agregar `"type": "module"` y los scripts:
   ```json
   "dev":   "node --watch --env-file=.env src/server.js",
   "start": "node --env-file=.env src/server.js"
   ```
   👉 Node moderno ya trae `--watch` (en lugar de nodemon) y `--env-file` (en lugar de dotenv).
2. Crear la estructura de carpetas vacía (`src/config`, `src/lib`, `src/middlewares`, `src/utils`, `src/modules`) y explicar para qué sirve cada una **antes** de escribir código.
3. `.gitignore` con `node_modules/` y `.env`. Crear `.env.example` (sí se sube) y `.env` (no se sube).
4. Escribir `src/config/env.js`.
   - 🎯 **Momento demo:** correr `npm run dev` con el `.env` incompleto y mostrar el error claro de zod. Después completarlo. *Fail fast*: es mejor que la app no arranque a que falle a las 3 a. m. con un `undefined`.

✅ **Checkpoint:** el proyecto arranca sin errores de configuración.

---

## Paso 3 — Primer endpoint: `/api/health` (10')

Escribir en este orden:

1. `src/app.js`: `createApp()` con `express.json()`, `cors()` y `morgan('dev')`.
   - ¿Por qué separar `app.js` de `server.js`? Para poder probar la app sin abrir un puerto (supertest).
2. `src/server.js`: solo `listen`.
3. `src/modules/health/health.routes.js` (solo el `GET /`) y `src/routes.js`, que lo monta bajo `/api`.
4. Abrir `http://localhost:3000/api/health` en el navegador y mostrar el log de morgan en la terminal.
5. Agregar `utils/http-error.js`, `middlewares/not-found.js` y `middlewares/error-handler.js`.
   - 🎯 Pedir `GET /api/nope` → 404 en JSON (no el HTML por defecto de Express).
   - Explicar que **todas** las respuestas de error tienen la misma forma. El frontend lo agradece.

✅ **Checkpoint:** `GET /api/health` → `200 { status: "ok" }`.

---

## Paso 4 — Conectar a Supabase: primer GET (15')

1. `src/lib/supabase.js`: un único cliente creado con la configuración validada, y el helper `unwrap()`, que convierte `{ data, error }` en dato o excepción.
2. Agregar `GET /api/health/db` y probarlo.
   - 🎯 Cambiar la URL del `.env` por una inválida → `503`. Restaurarla → `200`.
3. Crear el módulo `tasks` **de abajo hacia arriba**:
   - `tasks.repository.js` con solo `findAll()`. Es el **patrón Repository** (S7) y el único archivo del módulo que conoce Supabase.
   - `tasks.service.js` con `list()`.
   - `tasks.controller.js` con `list()`.
   - `tasks.routes.js`, que arma `repository → service → controller`. Esto es el **composition root**: el mismo trabajo que el contenedor de inyección de dependencias de NestJS (S8), pero hecho a mano.
4. `GET /api/tasks` devuelve las 3 filas.
   - 🎯 Agregar una fila desde el Table Editor de Supabase y refrescar: aparece.

✅ **Checkpoint:** datos reales de Supabase salen por nuestra API.

---

## Paso 5 — CRUD completo + validación (20')

1. Completar el repository (`findById`, `create`, `update`, `remove`), luego el service y el controller.
   - El **service** es quien decide que "no existe" es un 404. El repository solo devuelve `null`.
   - `maybeSingle()` vs `single()`: el primero devuelve `null` si no hay fila; el segundo da error.
2. `tasks.schema.js` con zod + `middlewares/validate.js`.
   - `z.coerce.number()` convierte el `"5"` de la URL en el número `5`.
   - `.trim()` limpia la entrada antes de guardarla.
3. Recorrer `requests.http` de arriba a abajo:
   - POST válido → `201`. POST con `title: ""` → `400` con `details`.
   - PATCH `{ "done": true }` → `200`. PATCH `{}` → `400`.
   - DELETE → `204`. DELETE otra vez → `404`.
   - `GET /api/tasks/abc` → `400`.
4. Mencionar que **Express 5** pasa automáticamente al error handler los errores lanzados en funciones `async`. En Express 4 hacía falta `try/catch` o `express-async-handler` en cada ruta.

✅ **Checkpoint:** API CRUD completa, con validación y errores consistentes, pero abierta.

---

## Paso 6 — Documentación con Swagger (15')

**Idea central:** una API sin documentación obliga a leer el código para saber cómo usarla. **OpenAPI** es el estándar para describir una API REST en JSON: rutas, parámetros, cuerpos, respuestas y seguridad. **Swagger UI** convierte esa descripción en una página interactiva para probar la API.

**Decisión de diseño:** no escribimos los schemas dos veces. zod 4 trae `z.toJSONSchema()`, así que **los mismos schemas que validan la entrada generan la documentación**. Si cambia la validación, la documentación cambia sola: una sola fuente de verdad.

```bash
npm i swagger-ui-express
```

1. Agregar ejemplos a los schemas con `.meta()` en `tasks.schema.js` (se ven en Swagger) y un `taskSchema` que describe la respuesta:
   ```js
   title: z.string().trim().min(1).max(200).meta({ example: 'Preparar la demo' }),
   ```
2. `src/docs/helpers.js`: funciones pequeñas para no repetir JSON (`toSchema`, `jsonBody`, `jsonResponse`, `errorResponse`, `idParam`).
3. **Cada módulo documenta sus rutas** en su propia carpeta: `health.docs.js` y `tasks.docs.js`. Es la misma idea que `tasks.routes.js`: el módulo es dueño de todo lo suyo.
4. `src/docs/openapi.js` junta los módulos en un solo documento OpenAPI 3.1 y define el schema común `Error`.
5. `src/docs/docs.routes.js` sirve:
   - `GET /api/docs` → Swagger UI
   - `GET /api/docs/openapi.json` → el JSON crudo (se puede importar en Postman o usarse para generar clientes)
6. Montarlo en `routes.js`: `apiRouter.use('/docs', docsRouter);`

> ⚠️ `helpers.js` está separado de `openapi.js` a propósito: `openapi.js` importa los `*.docs.js` y estos importan los helpers. Si los helpers vivieran en `openapi.js`, habría un import circular y la app fallaría al arrancar.

🎯 **Demo:**
- Abrir `http://localhost:3000/api/docs`. Recorrer los tags *Health* y *Tasks* y la sección *Schemas*.
- **Try it out** en `POST /tasks` con el ejemplo precargado → `201`. Con `title: ""` → `400`, y la respuesta coincide con el schema `Error` documentado.
- Cambiar `max(200)` por `max(100)` en `tasks.schema.js`, guardar (`--watch` reinicia) y refrescar: la documentación ya dice `maxLength: 100`.
- Abrir `/api/docs/openapi.json` e importarlo en Postman: la colección se arma sola.

🎯 **Cierre del paso (prepara el 7):** pedirle a un estudiante que abra el Swagger de la API del profesor (con la IP local, o con un túnel como `ngrok`, si está disponible) y use **Try it out** en `DELETE /tasks/{id}`. Funciona. **Cualquiera puede borrar todo**, y ahora con una interfaz que se lo pone fácil. Ese es el problema que resolvemos a continuación.

✅ **Checkpoint:** API documentada e interactiva, pero abierta. **Fin de la Parte A.**

---

## Paso 7 — Autenticación con JWT (30')

**Idea central:** la API emite un **token firmado** cuando el usuario se loguea. En cada request el cliente lo envía en el header `Authorization: Bearer <token>`, y un middleware lo verifica **antes** de llegar al controller. La base de datos no cambia: solo guarda usuarios.

```
1) POST /api/auth/register  { email, password }  ──►  guarda email + hash(bcrypt)
2) POST /api/auth/login     { email, password }  ──►  { accessToken: "eyJ..." }
3) GET  /api/tasks
   Authorization: Bearer eyJ...
        │
        ▼
   requireAuth ── sin token / firma inválida / expirado ──► 401
        │ ok → req.user = { id, email }
        ▼
   controller → service → repository   (sin cambios)
```

**Teoría breve (5'):** pegar un token en [jwt.io](https://jwt.io) y mostrar sus tres partes (header, payload y firma).
- El payload **no está cifrado**: cualquiera lo puede leer. Por eso nunca va información sensible.
- La **firma** es lo que importa: si alguien cambia el payload, la firma deja de coincidir y la API lo rechaza.
- *Stateless*: el servidor no guarda sesiones. Le basta el `JWT_SECRET` para verificar.

### 7.1 Preparación

```bash
npm i jsonwebtoken bcryptjs
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"   # → JWT_SECRET
```

En `.env` (y `.env.example` con valores de mentira):

```env
JWT_SECRET=<el valor generado>
JWT_EXPIRES_IN=1h
```

En `src/config/env.js`, agregar al schema:

```js
JWT_SECRET: z.string().min(32, 'Debe tener al menos 32 caracteres'),
JWT_EXPIRES_IN: z.string().default('1h'),
```

En Supabase → SQL Editor, ejecutar [`supabase/02_auth.sql`](./supabase/02_auth.sql): crea la tabla `users` (email único + `password_hash`).
- 🎯 Pregunta para la clase: **¿por qué no guardamos la contraseña?** Si roban la base de datos, los hashes de bcrypt no se pueden revertir (y bcrypt es lento a propósito).

### 7.2 Código (de abajo hacia arriba, igual que `tasks`)

**`src/utils/http-error.js`**: agregar dos fábricas

```js
static unauthorized(message = 'No autenticado') {
  return new HttpError(401, message);
}

static conflict(message) {
  return new HttpError(409, message);
}
```

**`src/lib/jwt.js`**: el único archivo que conoce la librería de JWT

```js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(user) {
  return jwt.sign({ email: user.email }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

// Lanza una excepción si el token fue alterado, está mal formado o expiró.
export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
}
```

**`src/modules/auth/auth.schema.js`**

```js
import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8).max(72),
});
```

**`src/modules/auth/users.repository.js`**

```js
import { unwrap } from '../../lib/supabase.js';

const TABLE = 'users';

export function createUsersRepository(db) {
  return {
    async findByEmail(email) {
      return unwrap(await db.from(TABLE).select('id, email, password_hash').eq('email', email).maybeSingle());
    },

    async create({ email, passwordHash }) {
      return unwrap(
        await db.from(TABLE).insert({ email, password_hash: passwordHash }).select('id, email, created_at').single(),
      );
    },
  };
}
```

**`src/modules/auth/auth.service.js`**

```js
import bcrypt from 'bcryptjs';
import { signToken } from '../../lib/jwt.js';
import { env } from '../../config/env.js';
import { HttpError } from '../../utils/http-error.js';

export function createAuthService(usersRepository) {
  return {
    async register({ email, password }) {
      if (await usersRepository.findByEmail(email)) throw HttpError.conflict('El email ya está registrado');
      const passwordHash = await bcrypt.hash(password, 10);
      return usersRepository.create({ email, passwordHash });
    },

    async login({ email, password }) {
      const user = await usersRepository.findByEmail(email);
      const valid = user && (await bcrypt.compare(password, user.password_hash));
      // Mismo mensaje si no existe el usuario o si la contraseña es incorrecta: no damos pistas.
      if (!valid) throw HttpError.unauthorized('Credenciales inválidas');
      return { accessToken: signToken(user), tokenType: 'Bearer', expiresIn: env.JWT_EXPIRES_IN };
    },
  };
}
```

**`src/modules/auth/auth.controller.js`**

```js
export function createAuthController(service) {
  return {
    async register(req, res) {
      res.status(201).json(await service.register(req.body));
    },

    async login(req, res) {
      res.json(await service.login(req.body));
    },

    me(req, res) {
      res.json(req.user);
    },
  };
}
```

**`src/middlewares/auth.js`**: la pieza central del paso

```js
import { verifyToken } from '../lib/jwt.js';
import { HttpError } from '../utils/http-error.js';

export function requireAuth(req, _res, next) {
  const [scheme, token] = (req.get('authorization') ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw HttpError.unauthorized('Falta el header Authorization: Bearer <token>');
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
  } catch {
    throw HttpError.unauthorized('Token inválido o expirado');
  }
  next();
}
```

**`src/modules/auth/auth.routes.js`**

```js
import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { validate } from '../../middlewares/validate.js';
import { requireAuth } from '../../middlewares/auth.js';
import { createUsersRepository } from './users.repository.js';
import { createAuthService } from './auth.service.js';
import { createAuthController } from './auth.controller.js';
import { credentialsSchema } from './auth.schema.js';

const service = createAuthService(createUsersRepository(supabase));
const controller = createAuthController(service);

export const authRouter = Router();

authRouter.post('/register', validate(credentialsSchema), controller.register);
authRouter.post('/login', validate(credentialsSchema), controller.login);
authRouter.get('/me', requireAuth, controller.me);
```

**`src/routes.js`**: `apiRouter.use('/auth', authRouter);`

**`src/modules/tasks/tasks.routes.js`**: 🎯 **el momento clave de la clase.** Para cerrar la API de tareas basta con **una línea**:

```js
import { requireAuth } from '../../middlewares/auth.js';
// ...
export const tasksRouter = Router();

tasksRouter.use(requireAuth);   // ← todas las rutas de tareas requieren token

tasksRouter.get('/', controller.list);
// ...las mismas rutas de antes
```

El controller, el service y el repository de `tasks` **no cambiaron ni una línea**. La seguridad es una preocupación transversal y vive en un middleware (Chain of Responsibility), no mezclada con la lógica de negocio. `/api/health` sigue siendo pública porque no tiene el middleware.

### 7.3 Documentar la autenticación en Swagger

**`src/docs/openapi.js`**: registrar el esquema de seguridad y el módulo de auth

```js
import { authDocs } from '../modules/auth/auth.docs.js';
// ...
const modules = [healthDocs, authDocs, tasksDocs];
// ...
components: {
  securitySchemes: {
    bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
  },
  schemas: { /* ...igual que antes */ },
},
```

**`src/docs/helpers.js`**: `secure()` marca todas las operaciones como protegidas y les agrega la respuesta `401`. Es el `requireAuth` de la documentación:

```js
export function secure(paths) {
  const result = {};
  for (const [path, item] of Object.entries(paths)) {
    result[path] = {};
    for (const [key, value] of Object.entries(item)) {
      result[path][key] =
        key === 'parameters'
          ? value
          : {
              ...value,
              security: [{ bearerAuth: [] }],
              responses: { ...value.responses, 401: errorResponse('Token faltante, inválido o expirado') },
            };
    }
  }
  return result;
}
```

**`src/modules/tasks/tasks.docs.js`**: el mismo paralelismo que en las rutas, una sola envoltura:

```js
paths: secure({
  '/tasks': { /* ...igual */ },
  '/tasks/{id}': { /* ...igual */ },
}),
```

**`src/modules/auth/auth.schema.js`**: agregar ejemplos y el formato de email (el `pipe` hace que se pierda):

```js
email: z.string().trim().toLowerCase().pipe(z.email()).meta({ format: 'email', example: 'ana@test.com' }),
password: z.string().min(8).max(72).meta({ example: 'supersecreta' }),
```

**`src/modules/auth/auth.docs.js`**

```js
import { errorResponse, jsonBody, jsonResponse, secure, toSchema } from '../../docs/helpers.js';
import { credentialsSchema } from './auth.schema.js';

const credentials = { $ref: '#/components/schemas/Credentials' };

const user = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email', example: 'ana@test.com' },
  },
};

export const authDocs = {
  tags: [{ name: 'Auth', description: 'Registro, login y usuario actual' }],
  schemas: {
    Credentials: toSchema(credentialsSchema),
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Registrar un usuario',
        requestBody: jsonBody(credentials),
        responses: {
          201: jsonResponse('Usuario creado', user),
          400: errorResponse('Datos inválidos'),
          409: errorResponse('El email ya está registrado'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Iniciar sesión y obtener un token',
        requestBody: jsonBody(credentials),
        responses: {
          200: jsonResponse('Token de acceso', {
            type: 'object',
            properties: {
              accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              tokenType: { type: 'string', example: 'Bearer' },
              expiresIn: { type: 'string', example: '1h' },
            },
          }),
          400: errorResponse('Datos inválidos'),
          401: errorResponse('Credenciales inválidas'),
        },
      },
    },
    ...secure({
      '/auth/me': {
        get: {
          tags: ['Auth'],
          summary: 'Usuario dueño del token',
          responses: { 200: jsonResponse('Usuario autenticado', user) },
        },
      },
    }),
  },
};
```

Al refrescar `/api/docs` aparece el botón **Authorize** y un candado en cada ruta protegida.

### 7.4 Demo en vivo

La demo se puede hacer completa desde Swagger: después del login (fila 5), copiar el `accessToken`, presionar **Authorize** y pegarlo (sin escribir "Bearer"). Gracias a `persistAuthorization`, el token sobrevive aunque se refresque la página.

| # | Request | Resultado esperado |
|---|---------|--------------------|
| 1 | `GET /api/tasks` (la misma del paso 5) | `401` Falta el header |
| 2 | `POST /api/auth/register` `{ "email": "ana@test.com", "password": "supersecreta" }` | `201` (sin el hash) |
| 3 | Repetir el registro | `409` email ya registrado |
| 4 | `POST /api/auth/login` con la contraseña incorrecta | `401` Credenciales inválidas |
| 5 | `POST /api/auth/login` correcto | `200 { accessToken }` |
| 6 | `GET /api/auth/me` con el token | `200 { id, email }` |
| 7 | `GET /api/tasks` con el token | `200` con las tareas ✅ |
| 8 | Cambiar **un carácter** del token y repetir | `401` Token inválido |
| 9 | Poner `JWT_EXPIRES_IN=30s` y esperar | `401` Token expirado |

En `requests.http`, el token se guarda en una variable:

```http
@token = eyJhbGciOi...

### Listar tareas (autenticado)
GET {{base}}/tasks
Authorization: Bearer {{token}}
```

🎯 Mostrar la tabla `users` en Supabase: solo hay hashes `$2b$10$...` y ninguna contraseña en texto plano.

✅ **Checkpoint:** misma API, mismas tareas, pero ahora solo con token.

---

## Paso 8 — Cierre (10')

**Recapitular** con el diagrama del paso 0. Repasar dónde quedó cada responsabilidad y qué patrones se usaron:
- **Layered:** routes, controller, service, repository.
- **Repository:** el acceso a datos queda aislado.
- **Factory + DI:** cada capa se crea con `createX(dependencia)`.
- **Middleware / Chain of Responsibility:** validate, auth y errores.
- **Single source of truth:** los schemas de zod validan la entrada y generan la documentación.

**Comparar con NestJS (S8):** lo que hicimos a mano tiene su equivalente en Nest.

| Hecho a mano | En NestJS |
|---|---|
| Composition root | Módulos y providers |
| `validate` | Pipes |
| `requireAuth` | Guards (`@UseGuards(AuthGuard)`) |
| `errorHandler` | Exception filters |
| `*.docs.js` + `toSchema()` | `@nestjs/swagger` (decoradores `@ApiProperty`, `@ApiBearerAuth`) |

**Ideas para tarea o proyecto:**

- **Tareas por usuario:** agregar `user_id` a `tasks` y filtrar por `req.user.id` en el service, para que cada quien vea solo las suyas. (Pista: el service recibe el `userId` y el repository agrega `.eq('user_id', userId)`.)
- **Roles:** un `role` en `users`, incluido en el token, y un middleware `requireRole('admin')`.
- Refresh tokens, o logout con una lista de tokens revocados.
- Paginación y filtros: `GET /api/tasks?done=true&page=2` (validar `req.query` con zod).
- Tests con `node:test` + `supertest` usando `createApp()` y un repositorio en memoria.
- Generar un cliente para el frontend a partir de `/api/docs/openapi.json` (por ejemplo, con `openapi-typescript`).
- Seguridad: `helmet` y `express-rate-limit` (sobre todo en `/auth/login`), y CORS restringido a un dominio.
- Deploy en Render o Railway con variables de entorno.

---

## Problemas comunes

| Síntoma | Causa probable |
|---|---|
| `node: .env: not found` | No se creó `.env` a partir de `.env.example`. |
| La app no arranca: `JWT_SECRET: Debe tener al menos 32 caracteres` | Falta generar el secreto (paso 7.1). |
| `Error de base de datos: Invalid API key` | Se copió la publishable key en lugar de la secret key. |
| `permission denied for table tasks` / `users` | No se ejecutó el `grant ... to service_role` del script SQL. |
| `relation "public.users" does not exist` | No se ejecutó `02_auth.sql`. |
| Siempre `401` aunque se envía el token | El header debe ser exactamente `Authorization: Bearer <token>` (con espacio, sin comillas), o el `JWT_SECRET` cambió después de generar el token. |
