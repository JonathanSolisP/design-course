import { unwrap } from '../../lib/supabase.js';

const TABLE_NAME = 'tasks';
const TABLE_COLUMNS = 'id, title, description, done, created_at'

export function createTaskRepository(supabase) {
    return {
        async findAll() {
            return unwrap(
                await supabase
                    .from(TABLE_NAME)
                    .select(TABLE_COLUMNS)
                    .order('created_at', { ascending: false })
            );
        },

        async create(task) {
            return unwrap(
                await supabase
                    .from(TABLE_NAME)
                    .insert(task)
                    .select(TABLE_COLUMNS)
                    .single()
            );
        }
    }
}