import { Router } from 'express';
import { supabase } from '../../lib/supabase.js';
import { validateSchema } from '../../middlewares/validate.js';
import { createTaskRepository } from './task.repository.js';
import { createTaskService } from './task.service.js';
import { createTaskController } from './task.controller.js';
import { createTaskSchema } from './task.schema.js';

const taskRepository = createTaskRepository(supabase);
const taskService = createTaskService(taskRepository);
const taskController = createTaskController(taskService);

export const tasksRouter = Router();

tasksRouter.get('/', taskController.list);
tasksRouter.post('/', validateSchema(createTaskSchema), taskController.create);