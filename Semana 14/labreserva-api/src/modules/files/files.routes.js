import { Router } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../../config.js';
import { HttpError } from '../../utils/http-error.js';

export const filesRouter = Router();

// Manuales de uso de los laboratorios.
// GET /api/files          → lista de manuales
// GET /api/files?name=... → descarga un manual
filesRouter.get('/', (req, res) => {
  const { name } = req.query;
  if (!name) return res.json(fs.readdirSync(config.manualsDir));

  const file = path.join(config.manualsDir, name);
  if (!fs.existsSync(file)) throw new HttpError(404, 'Manual no encontrado');
  res.type('text/plain').send(fs.readFileSync(file, 'utf8'));
});
