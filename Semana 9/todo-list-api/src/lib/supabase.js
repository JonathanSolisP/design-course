import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});

export function unwrap({data, error}) {
    if (error)  throw new Error(error.message);
    return data;
}