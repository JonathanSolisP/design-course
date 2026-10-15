import { HttpError } from '../../utils/http-error.js';

// Reglas de negocio. No sabe de Express ni de Supabase: solo usa el repositorio.
export function createTasksService(repository, events) {
  return {
    list: () => repository.findAll(),

    async getById(id) {
      const task = await repository.findById(id);
      if (!task) throw HttpError.notFound(`La tarea ${id} no existe`);
      return task;
    },

    async create(data) {
      const task = await repository.create(data);
      events.emit('change', { type: 'created', task });
      return task;
    },

    async update(id, changes) {
      const task = await repository.update(id, changes);
      if (!task) throw HttpError.notFound(`La tarea ${id} no existe`);
      events.emit('change', { type: 'updated', task });
      return task;
    },

    async remove(id) {
      const removed = await repository.remove(id);
      if (!removed) throw HttpError.notFound(`La tarea ${id} no existe`);
      events.emit('change', { type: 'deleted', task: { id } });
    },
  };
}
