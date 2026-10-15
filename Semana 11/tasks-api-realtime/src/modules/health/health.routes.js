import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { HttpError } from '../../utils/http-error.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

healthRouter.get('/db', async (_req, res) => {
  const { error } = await supabase.from('tasks').select('id', { head: true, count: 'exact' });
  if (error) throw new HttpError(503, `Base de datos no disponible: ${error.message}`);
  res.json({ status: 'ok', database: 'connected' });
});
