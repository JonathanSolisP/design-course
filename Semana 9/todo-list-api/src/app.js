import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { apiRouter } from './routes.js';

export function createApp() {
    const app = express();

    app.use(cors());
    app.use(morgan('dev'));
    app.use(express.json());

    app.use('/api', apiRouter);

    return app;
}