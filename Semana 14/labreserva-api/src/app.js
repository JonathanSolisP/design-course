import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { apiRouter } from './routes.js';
import { errorHandler } from './middlewares/error-handler.js';
import { HttpError } from './utils/http-error.js';

export function createApp() {
  const app = express();

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '50mb' }));
  app.use(morgan('dev'));
  app.use(express.static('public'));

  app.use('/api', apiRouter);

  app.use((req) => {
    throw new HttpError(404, `No existe la ruta ${req.method} ${req.originalUrl}`);
  });
  app.use(errorHandler);

  return app;
}
