import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { validate } from '../../middlewares/validate.js';
import { createTasksRepository } from './tasks.repository.js';
import { createTasksService } from './tasks.service.js';
import { createTasksController } from './tasks.controller.js';
import { createTaskSchema, taskIdParams, updateTaskSchema } from './tasks.schema.js';

// Composition root del módulo: aquí se arman las dependencias repository -> service -> controller.
const repository = createTasksRepository(supabase);
const service = createTasksService(repository);
const controller = createTasksController(service);

export const tasksRouter = Router();

tasksRouter.get('/', controller.list);
tasksRouter.get('/:id', validate(taskIdParams, 'params'), controller.getById);
tasksRouter.post('/', validate(createTaskSchema), controller.create);
tasksRouter.patch('/:id', validate(taskIdParams, 'params'), validate(updateTaskSchema), controller.update);
tasksRouter.delete('/:id', validate(taskIdParams, 'params'), controller.remove);
