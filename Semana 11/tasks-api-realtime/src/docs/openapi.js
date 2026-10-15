import { healthDocs } from '../modules/health/health.docs.js';
import { tasksDocs } from '../modules/tasks/tasks.docs.js';

// Cada módulo aporta sus tags, paths y schemas; aquí solo se juntan.
const modules = [healthDocs, tasksDocs];

export function buildOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Tasks API',
      version: '1.0.0',
      description: 'Demo del curso Diseño de Software: Web API en Express estructurada por capas + Supabase.',
    },
    servers: [{ url: '/api' }],
    tags: modules.flatMap((m) => m.tags),
    paths: Object.assign({}, ...modules.map((m) => m.paths)),
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                message: { type: 'string', example: 'Datos inválidos' },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: { field: { type: 'string' }, message: { type: 'string' } },
                  },
                },
              },
              required: ['message'],
            },
          },
        },
        ...Object.assign({}, ...modules.map((m) => m.schemas ?? {})),
      },
    },
  };
}
