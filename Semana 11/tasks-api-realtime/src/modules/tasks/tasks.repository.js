import { unwrap } from '../../lib/supabase.js';

// Capa de acceso a datos: es el ÚNICO archivo del módulo que conoce Supabase.
// Recibe el cliente por parámetro (inyección de dependencias): en los tests se puede pasar uno falso.
const TABLE = 'tasks';
const COLUMNS = 'id, title, description, done, created_at';

export function createTasksRepository(db) {
  return {
    async findAll() {
      return unwrap(await db.from(TABLE).select(COLUMNS).order('created_at', { ascending: false }));
    },

    async findById(id) {
      return unwrap(await db.from(TABLE).select(COLUMNS).eq('id', id).maybeSingle());
    },

    async create(task) {
      return unwrap(await db.from(TABLE).insert(task).select(COLUMNS).single());
    },

    async update(id, changes) {
      return unwrap(await db.from(TABLE).update(changes).eq('id', id).select(COLUMNS).maybeSingle());
    },

    async remove(id) {
      const deleted = unwrap(await db.from(TABLE).delete().eq('id', id).select('id').maybeSingle());
      return deleted !== null;
    },
  };
}
