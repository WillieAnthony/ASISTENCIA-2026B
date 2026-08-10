-- Registro — esquema para Supabase
-- Cómo usarlo:
-- 1. Entra a https://supabase.com/dashboard
-- 2. Abre tu proyecto
-- 3. Menú izquierdo → SQL Editor → New query
-- 4. Pega este archivo completo → Run

-- Extensión para UUIDs
create extension if not exists "pgcrypto";

-- Catálogo de licenciaturas
create table if not exists public.licenciaturas (
  id serial primary key,
  nombre text not null unique
);

insert into public.licenciaturas (nombre) values
  ('Licenciatura en Seguridad Ciudadana'),
  ('Licenciatura de Ingeniería en Computación'),
  ('Licenciatura de Ingeniería Mecánica'),
  ('Licenciatura de Ingeniería en Plásticos'),
  ('Licenciatura de Ingeniería en Producción Industrial'),
  ('Licenciatura de Ingeniería en Software'),
  ('Licenciatura en Ingeniería en Ciberseguridad')
on conflict (nombre) do nothing;

-- Salones / sesiones con QR (las crea el maestro)
create table if not exists public.salones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  creado_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  activo boolean not null default true
);

-- Asistencias de alumnos (formulario público del QR)
create table if not exists public.asistencias (
  id uuid primary key default gen_random_uuid(),
  salon_id uuid not null references public.salones (id) on delete cascade,
  numero_cuenta text not null,
  nombre text not null,
  apellido_paterno text not null,
  apellido_materno text not null,
  licenciatura text not null,
  semestre integer not null check (semestre between 1 and 10),
  registrado_en timestamptz not null default now(),
  constraint asistencias_cuenta_salon_unique unique (salon_id, numero_cuenta),
  constraint asistencias_cuenta_solo_numeros check (numero_cuenta ~ '^[0-9]{5,12}$'),
  constraint asistencias_nombre_letras check (nombre ~ '^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]+$'),
  constraint asistencias_ap_letras check (apellido_paterno ~ '^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]+$'),
  constraint asistencias_am_letras check (apellido_materno ~ '^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ ]+$')
);

create index if not exists asistencias_salon_id_idx on public.asistencias (salon_id);
create index if not exists salones_creado_por_idx on public.salones (creado_por);

-- Row Level Security
alter table public.licenciaturas enable row level security;
alter table public.salones enable row level security;
alter table public.asistencias enable row level security;

-- Licenciaturas: cualquiera puede leerlas (combo del formulario)
drop policy if exists "licenciaturas_public_read" on public.licenciaturas;
create policy "licenciaturas_public_read"
  on public.licenciaturas for select
  using (true);

-- Salones: el maestro autenticado administra los suyos
drop policy if exists "salones_maestro_select" on public.salones;
create policy "salones_maestro_select"
  on public.salones for select
  to authenticated
  using (creado_por = auth.uid());

drop policy if exists "salones_maestro_insert" on public.salones;
create policy "salones_maestro_insert"
  on public.salones for insert
  to authenticated
  with check (creado_por = auth.uid());

drop policy if exists "salones_maestro_update" on public.salones;
create policy "salones_maestro_update"
  on public.salones for update
  to authenticated
  using (creado_por = auth.uid())
  with check (creado_por = auth.uid());

-- Alumno (anónimo) puede leer un salón activo para validar el QR
drop policy if exists "salones_public_read_activos" on public.salones;
create policy "salones_public_read_activos"
  on public.salones for select
  to anon
  using (activo = true);

-- Asistencias: alumno puede insertar si el salón está activo
drop policy if exists "asistencias_public_insert" on public.asistencias;
create policy "asistencias_public_insert"
  on public.asistencias for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.salones s
      where s.id = salon_id and s.activo = true
    )
  );

-- Maestro ve solo asistencias de sus salones
drop policy if exists "asistencias_maestro_select" on public.asistencias;
create policy "asistencias_maestro_select"
  on public.asistencias for select
  to authenticated
  using (
    exists (
      select 1 from public.salones s
      where s.id = salon_id and s.creado_por = auth.uid()
    )
  );
