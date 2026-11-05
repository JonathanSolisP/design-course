// Devuelve el detalle completo del error para facilitar la depuración desde el frontend.
export function errorHandler(err, req, res, _next) {
  console.error(err);
  res.status(err.status ?? 500).json({
    error: err.message,
    path: req.originalUrl,
    stack: err.stack,
  });
}
