# Tarea: Tasks API multiusuario

**Instituto Tecnológico de Costa Rica** · Campus Tecnológico San Carlos · Ingeniería en Computación
**Curso:** Diseño de Software · **Profesor:** Ing. Jonathan Solís Parajeles

- **Fecha de inicio:** jueves 8 de octubre de 2026, 12:30 p. m.
- **Fecha de entrega:** jueves 22 de octubre de 2026, 12:30 p. m.
- **Modalidad:** individual
- **Valor porcentual:** ____%

---

## Objetivo

Extender la `tasks-api` de la Semana 9 hasta convertirla en una API **multiusuario**, con autenticación, nuevos módulos, consultas con filtros y pruebas automatizadas. Todo esto sin romper la arquitectura en capas que vimos en clase, y documentando las decisiones de diseño que se tomen en el camino.

## Descripción general

En clase la API llegó hasta el paso 6: tiene un CRUD de tareas, validación y Swagger, pero **está abierta** y todas las tareas son de todos. La tarea continúa la historia:

1. **Cerrarla:** solo un usuario autenticado puede usarla.
2. **Hacerla de cada quien:** cada usuario ve y modifica únicamente sus tareas.
3. **Hacerla crecer:** agregar un módulo nuevo (`projects`) y consultas con filtros y paginación.
4. **Hacerla confiable:** pruebas automatizadas que no dependen de Supabase.

Lo que se evalúa no es solo que funcione, sino **dónde vive cada cambio**. Una regla de negocio en el controller, o una consulta de Supabase en el service, se considera un error de diseño aunque el endpoint responda bien.

---

## Punto de partida

- El código de `Semana 9/tasks-api` (cada estudiante trabaja en **su propio repositorio** y en **su propio proyecto de Supabase**).
- El `TUTORIAL.md` del mismo proyecto, que trae el paso 7 (JWT) completo.

---

## Acciones

### Parte 1: Autenticación con JWT

Implementar el paso 7 del `TUTORIAL.md`: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` y el middleware `requireAuth` aplicado a `/api/tasks`. También debe quedar documentado en Swagger (botón **Authorize**).

> Esta parte es guiada. Su propósito es que todos partan de la misma base.

### Parte 2: Tareas por usuario (*ownership*)

- Agregar la columna `user_id` (FK a `users`) a `tasks` mediante un script nuevo: `supabase/03_ownership.sql`. **No** se deben modificar los scripts anteriores.
- Cada operación sobre tareas (listar, obtener, crear, actualizar y eliminar) aplica únicamente a las tareas del usuario del token.
- El `user_id` **nunca** viene del body: sale de `req.user.id`. Si el cliente lo envía, se ignora o se rechaza (decidir y justificar).
- Si un usuario pide una tarea de otro usuario, la API responde **`404`**, no `403`. Explicar por qué en el documento de decisiones.

**Restricción de diseño:** el controller solo pasa `req.user.id` al service, y el filtro por usuario se aplica en el repository. El middleware `requireAuth` no debe cambiar.

### Parte 3: Nuevo módulo `projects`

Un usuario agrupa sus tareas en proyectos.

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/projects` | Proyectos del usuario |
| GET | `/api/projects/:id` | Un proyecto, con la cantidad de tareas pendientes y hechas |
| POST | `/api/projects` | Crear (`name`, `color?`) |
| PATCH | `/api/projects/:id` | Actualizar parcialmente |
| DELETE | `/api/projects/:id` | Eliminar |

- `tasks` recibe un `project_id` opcional. Al crear o actualizar una tarea con `projectId`, el **service** verifica que ese proyecto exista y sea del mismo usuario (si no, `400` o `404`, según se justifique).
- Definir qué pasa con las tareas al borrar un proyecto: `on delete cascade`, `set null`, o rechazar con `409` si tiene tareas. Cualquiera es válida si está justificada.
- El módulo debe seguir **exactamente** la estructura de `tasks`: `projects.routes.js`, `.controller.js`, `.service.js`, `.repository.js`, `.schema.js` y `.docs.js`, todos protegidos con `requireAuth` y documentados con `secure()`.

### Parte 4: Filtros, orden y paginación

`GET /api/tasks` acepta estos parámetros, todos opcionales y validados con zod:

```
GET /api/tasks?done=false&projectId=3&search=demo&sort=created_at&order=asc&page=2&limit=10
```

- `limit` tiene un máximo de 50 y un valor por defecto de 20. `page` empieza en 1.
- La respuesta cambia de forma: `{ data: [...], page, limit, total }`. Esto es un **cambio que rompe el contrato** con los clientes. En el documento de decisiones, explicar cómo se manejaría en una API real (versionar, agregar un endpoint nuevo, etc.).
- Valores inválidos (`limit=500`, `done=quizas`, `sort=password`) → `400` con `details`.
- Los parámetros deben aparecer documentados en Swagger, generados desde el schema de zod (una sola fuente de verdad).

> 💡 **Pista:** el middleware `validate` actual hace `req[source] = result.data`. En **Express 5**, `req.query` es de solo lectura, así que eso no funciona para `'query'`. Hay que resolverlo sin romper los usos actuales del middleware (por ejemplo, guardando el resultado en `req.validated`, o en otra propiedad que se decida).

### Parte 5: Pruebas automatizadas

Usar `node:test` + `supertest`. **Las pruebas no deben conectarse a Supabase.**

Hoy `tasks.routes.js` crea el repository con el cliente real **al importar el archivo**, así que no hay forma de sustituirlo en las pruebas. Hay que hacer el refactor:

- `createApp(deps)` recibe las dependencias (por ejemplo, `{ tasksRepository, projectsRepository, usersRepository }`) y las pasa a los routers. Los routers pasan a ser fábricas: `createTasksRouter(repository)`.
- `server.js` se convierte en el **composition root** real: crea los repositories de Supabase y llama a `createApp`.
- Escribir un **repository en memoria** (`tasks.memory-repository.js`) con la misma interfaz que el de Supabase.

Como mínimo, deben cubrirse estos casos:

1. Sin token → `401`.
2. El usuario A no puede ver, modificar ni borrar una tarea del usuario B (`404`).
3. `POST /tasks` inválido → `400` con `details`.
4. La paginación devuelve el `total` correcto y respeta `limit`.
5. No se puede asignar una tarea a un proyecto de otro usuario.
6. Al menos una prueba **unitaria** del service, sin HTTP, con un repository falso.

Agregar el script `"test": "node --env-file=.env.test --test"` al `package.json`. El `.env.test` sí se sube al repositorio y usa valores **falsos** (por ejemplo, `SUPABASE_URL=http://localhost:1` y un `JWT_SECRET` de prueba): `env.js` los exige para arrancar, pero ninguna prueba debe llegar a usarlos para hablar con Supabase.

> 💡 **Pista:** `tasks.repository.js` importa `unwrap` desde `lib/supabase.js`, y ese archivo crea el cliente real al importarse. Pregúntese si `unwrap` debería vivir en otro lado.

### Parte 6 (opcional, hasta +10 puntos extra)

Escoger **una**:

- **Roles:** columna `role` en `users`, incluida en el token, y un middleware `requireRole('admin')`. El admin puede listar todas las tareas en `GET /api/admin/tasks`.
- **Seguridad:** `helmet`, `express-rate-limit` en `/auth/login` (máximo 5 intentos por minuto) y CORS restringido a un origen configurado en `.env`.
- **Deploy:** la API publicada en Render o Railway, con la URL de Swagger funcionando.
- **Cliente tipado:** generar tipos con `openapi-typescript` a partir de `/api/docs/openapi.json` y consumirlos desde un frontend mínimo (puede ser el de la Semana 8).

---

## Entregables

1. **Repositorio** (enlace) con el código, los scripts SQL numerados y un `.env.example` actualizado. ⚠️ Si el `.env` o la secret key aparecen en el historial de git, se pierden los puntos de la Parte 1.
2. **README** actualizado: puesta en marcha, nuevos endpoints y cómo correr las pruebas.
3. **`requests.http`** actualizado, con el flujo completo: registro → login → crear proyecto → crear tareas → filtrar.
4. **`DECISIONES.md`**: entre 4 y 6 decisiones en formato ADR corto (*Contexto · Decisión · Alternativas consideradas · Consecuencias*). Como mínimo debe incluir:
   - `404` vs `403` para recursos de otro usuario.
   - Qué pasa con las tareas al borrar un proyecto.
   - Cómo se resolvió `validate` para `req.query`.
   - Cómo se manejaría el cambio de forma de la respuesta de `GET /tasks`.
   - Cómo quedó armada la inyección de dependencias y por qué permite probar sin Supabase.
5. **Captura** de `npm test` con todas las pruebas en verde.

---

## Aspectos administrativos

- La tarea es **individual**. Se puede conversar sobre ideas con los compañeros, pero el código y el documento son propios.
- En caso de fraude, ya sea provocado o consentido, la tarea será anulada para todos los involucrados, de acuerdo con el Artículo 75 del Reglamento del Régimen de Enseñanza-Aprendizaje del ITCR.
- Se permite usar asistentes de IA, pero cada estudiante debe poder **explicar y modificar en vivo** cualquier parte de su código. El profesor puede pedir una defensa corta (5 minutos) al azar.
- Las entregas tardías se penalizan con un 10 % de la nota por cada hora de retraso.
- Todo se entrega en la plataforma oficial del curso.

---

## Evaluación

| Rubro | Valor |
|-------|-------|
| Parte 1: Autenticación JWT funcionando y documentada | 10 % |
| Parte 2: Tareas por usuario (aislamiento correcto, `user_id` desde el token) | 20 % |
| Parte 3: Módulo `projects` (estructura en capas, reglas en el service, relación con tasks) | 20 % |
| Parte 4: Filtros, orden y paginación (validación de query, Swagger generado) | 15 % |
| Parte 5: Refactor de DI y pruebas sin Supabase | 20 % |
| `DECISIONES.md`: calidad de la justificación y alternativas consideradas | 15 % |
| Parte 6 (opcional) | +10 pts |

**Criterio transversal:** cada parte se califica también por **dónde quedó el código**. Si una responsabilidad queda en la capa equivocada (Supabase fuera del repository, reglas de negocio en el controller, `req`/`res` dentro del service), se pierde hasta la mitad del puntaje de esa parte.

---

## Checklist de aceptación (para auto-revisión)

| # | Request | Esperado |
|---|---------|----------|
| 1 | `GET /api/tasks` sin token | `401` |
| 2 | Registro y login de **ana** y de **beto** | `201`, `200 { accessToken }` |
| 3 | Ana crea el proyecto "Curso" y 3 tareas en él | `201` |
| 4 | Beto hace `GET /api/tasks` | `200`, sin ninguna tarea de Ana |
| 5 | Beto hace `GET /api/tasks/<id de Ana>` | `404` |
| 6 | Beto crea una tarea con el `projectId` de Ana | `400` o `404` |
| 7 | Ana hace `GET /api/tasks?done=false&limit=2` | `200 { data: [2 tareas], total: 3 }` |
| 8 | `GET /api/tasks?limit=500` | `400` con `details` |
| 9 | Ana hace `GET /api/projects/<id>` | `200`, con los conteos de pendientes y hechas |
| 10 | `npm test` sin internet (o con el proyecto de Supabase pausado) | Todo en verde |
