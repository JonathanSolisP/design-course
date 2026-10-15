# Taller: tareas en tiempo real con Server-Sent Events

**Punto de partida:** la `tasks-api` de la Semana 9 (Express + Supabase).
**Objetivo:** cuando alguien crea, edita o borra una tarea, todos los navegadores abiertos lo ven al instante, sin recargar.
**Duración:** ~25 minutos. **Dependencias nuevas:** ninguna.

```
POST /api/tasks ──► Controller ──► Service ──► Repository ──► Supabase
                                     │
                                     └─ emit('change') ──► taskEvents ──► GET /api/tasks/stream ──► navegadores
```

---

## Paso 1: bus de eventos

`src/lib/events.js` (nuevo)

```js
import { EventEmitter } from 'node:events';

// Bus de eventos en memoria: el servicio publica, los clientes SSE escuchan.
export const taskEvents = new EventEmitter();
```

## Paso 2: el servicio publica los cambios

`src/modules/tasks/tasks.service.js`

```js
export function createTasksService(repository, events) {
  return {
    list: () => repository.findAll(),

    async getById(id) { /* sin cambios */ },

    async create(data) {
      const task = await repository.create(data);
      events.emit('change', { type: 'created', task });
      return task;
    },

    async update(id, changes) {
      const task = await repository.update(id, changes);
      if (!task) throw HttpError.notFound(`La tarea ${id} no existe`);
      events.emit('change', { type: 'updated', task });
      return task;
    },

    async remove(id) {
      const removed = await repository.remove(id);
      if (!removed) throw HttpError.notFound(`La tarea ${id} no existe`);
      events.emit('change', { type: 'deleted', task: { id } });
    },
  };
}
```

> El evento se emite en el **servicio** y no en el controller: así cualquier entrada (HTTP, un job, un script) dispara la notificación. Es el patrón Observer de la Semana 7.

## Paso 3: endpoint SSE

`src/modules/tasks/tasks.controller.js`: recibe `events` y agrega un método:

```js
export function createTasksController(service, events) {
  return {
    // ...list, getById, create, update, remove sin cambios

    stream(req, res) {
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.flushHeaders();

      const send = (event) => res.write(`data: ${JSON.stringify(event)}\n\n`);
      events.on('change', send);
      req.on('close', () => events.off('change', send));
    },
  };
}
```

`src/modules/tasks/tasks.routes.js`: inyectar el bus y registrar la ruta **antes** de `/:id`:

```js
import { taskEvents } from '../../lib/events.js';

const repository = createTasksRepository(supabase);
const service = createTasksService(repository, taskEvents);
const controller = createTasksController(service, taskEvents);

tasksRouter.get('/', controller.list);
tasksRouter.get('/stream', controller.stream); // antes de '/:id'
tasksRouter.get('/:id', validate(taskIdParams, 'params'), controller.getById);
// ...
```

## Paso 4: cliente

`src/app.js`: servir archivos estáticos (después de `morgan`):

```js
app.use(express.static('public'));
```

`public/live.html` (nuevo, en la raíz del proyecto):

```html
<!doctype html>
<meta charset="utf-8">
<title>Tareas en vivo</title>
<h1>Tareas en vivo</h1>
<ul id="log"></ul>
<script>
  const log = document.getElementById('log');
  const source = new EventSource('/api/tasks/stream');

  source.onmessage = (e) => {
    const { type, task } = JSON.parse(e.data);
    const li = document.createElement('li');
    li.textContent = `${type}: #${task.id} ${task.title ?? ''}`;
    log.prepend(li);
  };
</script>
```

## Paso 5: probar

1. `npm run dev`
2. Abrir `http://localhost:3000/live.html` en **dos** pestañas.
3. Crear, editar y borrar tareas con `requests.http` o Swagger (`/api/docs`).
4. Ver el stream crudo en una terminal:

```
$ curl -N localhost:3000/api/tasks/stream
data: {"type":"created","task":{"id":1,"title":"Preparar la demo","done":false,...}}

data: {"type":"updated","task":{"id":1,"title":"Preparar la demo","done":true,...}}

data: {"type":"deleted","task":{"id":1}}
```

---

## Para pensar

| Problema | Por qué se rompe | Solución |
|---|---|---|
| 3 instancias detrás de un balanceador | El `EventEmitter` vive en la memoria de una sola instancia | Redis Pub/Sub o Kafka como bus |
| Alguien cambia la BD directamente | El cambio no pasa por el servicio y nadie emite el evento | Supabase Realtime / CDC |
| La API tiene autenticación | `EventSource` no puede enviar el header `Authorization` | Cookie de sesión o un token corto en la query |
| El cliente también necesita enviar | SSE solo va de servidor a cliente | WebSocket (`ws` o Socket.IO) |

**Reto:** cambiar `live.html` para que cargue la lista completa (`GET /api/tasks`) y la mantenga actualizada con los eventos (agregar, reemplazar y quitar elementos según `type`).
