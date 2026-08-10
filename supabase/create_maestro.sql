-- Crear maestro en Auth (contraseña encriptada con bcrypt)
-- Pégalo en SQL Editor → Run
-- Cambia maestro_email y maestro_password antes de ejecutar.

create extension if not exists pgcrypto;

do $$
declare
  new_user_id uuid := gen_random_uuid();
  maestro_email text := 'TU_CORREO_AQUI';
  maestro_password text := 'TU_PASSWORD_AQUI';
begin
  if exists (select 1 from auth.users where email = maestro_email) then
    raise notice 'El usuario % ya existe', maestro_email;
    return;
  end if;

  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    new_user_id,
    'authenticated',
    'authenticated',
    maestro_email,
    extensions.crypt(maestro_password, extensions.gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    gen_random_uuid(),
    new_user_id,
    jsonb_build_object(
      'sub', new_user_id::text,
      'email', maestro_email,
      'email_verified', true
    ),
    'email',
    new_user_id::text,
    now(),
    now(),
    now()
  );

  raise notice 'Maestro creado: % (password hasheada en auth.users.encrypted_password)', maestro_email;
end $$;
