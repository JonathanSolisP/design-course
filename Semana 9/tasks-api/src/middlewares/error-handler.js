import { env } from '../config/env.js';

// Único lugar donde los errores se convierten en respuestas HTTP.
// Express 5 envía aquí automáticamente los errores lanzados en handlers async.
export function errorHandler(err, _req, res, _next) {
  const status = err.status ?? 500;
  if (status >= 500) console.error(err);

  const hideMessage = status >= 500 && env.NODE_ENV === 'production';
  res.status(status).json({
    error: {
      message: hideMessage ? 'Error interno del servidor' : err.message,
      ...(err.details && { details: err.details }),
    },
  });
}
