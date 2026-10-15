import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { buildOpenApiSpec } from './openapi.js';

const spec = buildOpenApiSpec();

export const docsRouter = Router();

// JSON crudo: sirve para Postman, generadores de clientes, etc.
docsRouter.get('/openapi.json', (_req, res) => res.json(spec));

// Interfaz interactiva en /api/docs
docsRouter.use('/', swaggerUi.serve, swaggerUi.setup(spec, { swaggerOptions: { persistAuthorization: true } }));
