-- Paso 6: usuarios de la API (ejecutar en Supabase → SQL Editor al llegar a autenticación)
-- La autenticación la hace NUESTRA API: aquí solo guardamos usuarios y hashes de contraseña.

create table if not exists public.users (
  id            uuid        primary key default gen_random_uuid(),
  email         text        not null unique,
  password_hash text        not null,
  created_at    timestamptz not null default now()
);

-- Igual que tasks: cerrada para todos excepto la API (secret key).
alter table public.users enable row level security;
grant select, insert, update, delete on public.users to service_role;
