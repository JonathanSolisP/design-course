import { HttpError } from '../utils/http-error.js';

export function notFound(req, _res, next) {
  next(HttpError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}
