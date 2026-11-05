import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { labsRouter } from './modules/labs/labs.routes.js';
import { reservationsRouter } from './modules/reservations/reservations.routes.js';
import { filesRouter } from './modules/files/files.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { debugRouter } from './modules/debug/debug.routes.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => res.json({ status: 'ok' }));

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/labs', labsRouter);
apiRouter.use('/reservations', reservationsRouter);
apiRouter.use('/files', filesRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/debug', debugRouter);
