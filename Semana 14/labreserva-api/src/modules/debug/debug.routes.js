import { Router } from 'express';
import { config } from '../../config.js';

export const debugRouter = Router();

// Para revisar rápido con qué configuración arrancó el servidor.
debugRouter.get('/config', (_req, res) => {
  res.json({ config, node: process.version, uptime: process.uptime() });
});
