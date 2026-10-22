-- Registro — esquema para Supabase
-- Cómo usarlo:
-- 1. Entra a https://supabase.com/dashboard
-- 2. Abre tu proyecto
-- 3. Menú izquierdo → SQL Editor → New query
-- 4. Pega este archivo completo → Run
--
-- Es idempotente: puedes volver a ejecutarlo sobre una base existente
-- para aplicar los cambios sin perder datos.
--
-- Nota: la tabla se llama `salones` por compatibilidad, pero cada fila es
-- un "evento" (un QR con nombre). Cada QR tiene su propio listado.

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

-- Eventos con QR (los crea el maestro)
create table if not exists public.salones (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  creado_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  activo boolean not null default true
);

alter table public.salones drop constraint if exists salones_nombre_longitud;
alter table public.salones add constraint salones_nombre_longitud
  check (char_length(btrim(nombre)) between 1 and 80) not valid;

-- Asistencias de alumnos (formulario del QR)
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
  constraint asistencias_cuenta_solo_numeros check (numero_cuenta ~ '^[0-9]{5,12}$')
);

-- Nombres: letras, espacios, guion y apóstrofo (p. ej. "Pérez-Gómez", "O'Neil")
alter table public.asistencias drop constraint if exists asistencias_nombre_letras;
alter table public.asistencias drop constraint if exists asistencias_ap_letras;
alter table public.asistencias drop constraint if exists asistencias_am_letras;
alter table public.asistencias add constraint asistencias_nombre_letras
  check (nombre ~ '^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ'' -]+$');
alter table public.asistencias add constraint asistencias_ap_letras
  check (apellido_paterno ~ '^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ'' -]+$');
alter table public.asistencias add constraint asistencias_am_letras
  check (apellido_materno ~ '^[A-Za-zÁÉÍÓÚáéíóúÜüÑñ'' -]+$');

create index if not exists asistencias_salon_id_idx on public.asistencias (salon_id);
create index if not exists salones_creado_por_idx on public.salones (creado_por);

-- Row Level Security
alter table public.licenciaturas enable row level security;
alter table public.salones enable row level security;
alter table public.asistencias enable row level security;

-- Licenciaturas: cualquiera puede leerlas
drop policy if exists "licenciaturas_public_read" on public.licenciaturas;
create policy "licenciaturas_public_read"
  on public.licenciaturas for select
  using (true);

-- Eventos: el maestro autenticado administra los suyos
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

-- Los alumnos ya NO leen la tabla ni insertan directamente: antes cualquiera
-- con la anon key podía listar todos los eventos activos y registrarse en
-- ellos sin haber visto el QR. Ahora solo pasan por las funciones de abajo,
-- que exigen conocer el id exacto del evento.
drop policy if exists "salones_public_read_activos" on public.salones;
drop policy if exists "asistencias_public_insert" on public.asistencias;

-- Maestro ve solo asistencias de sus eventos
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

-- Funciones públicas (alumno). security definer: corren con permisos del
-- dueño, así funcionan igual para anon y para un maestro con sesión abierta
-- que escanea el QR de otro maestro.

create or replace function public.get_evento_publico(p_id uuid)
returns table (id uuid, nombre text, creado_en timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.nombre, s.creado_en
  from public.salones s
  where s.id = p_id and s.activo = true;
$$;

create or replace function public.registrar_asistencia(
  p_salon_id uuid,
  p_numero_cuenta text,
  p_nombre text,
  p_apellido_paterno text,
  p_apellido_materno text,
  p_licenciatura text,
  p_semestre integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.salones s where s.id = p_salon_id and s.activo = true
  ) then
    raise exception 'evento_no_disponible' using errcode = 'P0002';
  end if;

  if not exists (
    select 1 from public.licenciaturas l where l.nombre = p_licenciatura
  ) then
    raise exception 'licenciatura_invalida' using errcode = '22023';
  end if;

  insert into public.asistencias (
    salon_id,
    numero_cuenta,
    nombre,
    apellido_paterno,
    apellido_materno,
    licenciatura,
    semestre
  ) values (
    p_salon_id,
    btrim(p_numero_cuenta),
    regexp_replace(btrim(p_nombre), '\s+', ' ', 'g'),
    regexp_replace(btrim(p_apellido_paterno), '\s+', ' ', 'g'),
    regexp_replace(btrim(p_apellido_materno), '\s+', ' ', 'g'),
    p_licenciatura,
    p_semestre
  );
end;
$$;

revoke all on function public.get_evento_publico(uuid) from public;
revoke all on function public.registrar_asistencia(uuid, text, text, text, text, text, integer) from public;
grant execute on function public.get_evento_publico(uuid) to anon, authenticated;
grant execute on function public.registrar_asistencia(uuid, text, text, text, text, text, integer) to anon, authenticated;

-- Tiempo real: el panel del maestro recibe las asistencias nuevas al momento
-- (RLS sigue aplicando: cada maestro solo recibe las de sus eventos).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'asistencias'
  ) then
    alter publication supabase_realtime add table public.asistencias;
  end if;
end $$;
