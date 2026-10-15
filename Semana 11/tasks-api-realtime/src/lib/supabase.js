import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

// Cliente de servidor con la secret key: la base de datos confía en la API,
// así que la API es la responsable de decidir quién puede hacer qué.
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Convierte la respuesta { data, error } de Supabase en dato o excepción.
export function unwrap({ data, error }) {
  if (error) throw new HttpError(500, `Error de base de datos: ${error.message}`, { code: error.code });
  return data;
}
