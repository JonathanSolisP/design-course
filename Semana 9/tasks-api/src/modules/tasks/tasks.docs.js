import { errorResponse, idParam, jsonBody, jsonResponse, toSchema } from '../../docs/helpers.js';
import { createTaskSchema, taskSchema, updateTaskSchema } from './tasks.schema.js';

const task = { $ref: '#/components/schemas/Task' };

export const tasksDocs = {
  tags: [{ name: 'Tasks', description: 'CRUD de tareas' }],
  schemas: {
    Task: toSchema(taskSchema, 'output'),
    CreateTask: toSchema(createTaskSchema),
    UpdateTask: { ...toSchema(updateTaskSchema), minProperties: 1 },
  },
  paths: {
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Listar tareas',
        responses: {
          200: jsonResponse('Lista de tareas', { type: 'array', items: task }),
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Crear una tarea',
        requestBody: jsonBody({ $ref: '#/components/schemas/CreateTask' }),
        responses: {
          201: jsonResponse('Tarea creada', task),
          400: errorResponse('Datos inválidos'),
        },
      },
    },
    '/tasks/{id}': {
      parameters: [idParam],
      get: {
        tags: ['Tasks'],
        summary: 'Obtener una tarea',
        responses: {
          200: jsonResponse('La tarea', task),
          400: errorResponse('Id inválido'),
          404: errorResponse('La tarea no existe'),
        },
      },
      patch: {
        tags: ['Tasks'],
        summary: 'Actualizar parcialmente una tarea',
        requestBody: jsonBody({ $ref: '#/components/schemas/UpdateTask' }),
        responses: {
          200: jsonResponse('Tarea actualizada', task),
          400: errorResponse('Datos inválidos'),
          404: errorResponse('La tarea no existe'),
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Eliminar una tarea',
        responses: {
          204: { description: 'Eliminada' },
          404: errorResponse('La tarea no existe'),
        },
      },
    },
  },
};
