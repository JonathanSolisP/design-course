import { errorResponse, jsonResponse } from '../../docs/helpers.js';

export const healthDocs = {
  tags: [{ name: 'Health', description: 'Estado de la API y de la base de datos' }],
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'La API está viva',
        responses: {
          200: jsonResponse('OK', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              uptime: { type: 'number', example: 12.5 },
              timestamp: { type: 'string', format: 'date-time' },
            },
          }),
        },
      },
    },
    '/health/db': {
      get: {
        tags: ['Health'],
        summary: 'La API llega a Supabase',
        responses: {
          200: jsonResponse('Conectada', {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              database: { type: 'string', example: 'connected' },
            },
          }),
          503: errorResponse('Base de datos no disponible'),
        },
      },
    },
  },
};
