import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes.js';
import { tasksRouter } from './modules/task/task.routes.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/tasks', tasksRouter);