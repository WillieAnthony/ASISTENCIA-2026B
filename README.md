# Registro

Aplicación web de registro de asistencias (interfaz en React). Más adelante se conectará a Supabase.

## Desarrollo

1. Copia `.env.example` a `.env.local` y pon tu `VITE_SUPABASE_ANON_KEY`.
2. En Supabase SQL Editor ejecuta `supabase/schema.sql` y `supabase/create_maestro.sql`.
3. Arranca la app:

```bash
npm install
npm run dev
```

## Flujo

1. **Alumno** (`/r/:salonId` desde el QR): envía asistencia a Supabase.
2. **Maestro**: inicia sesión → genera QR, ve asistencias y descarga Excel.

### Acceso maestro

Crea el usuario en Supabase (Authentication o `supabase/create_maestro.sql`) con el correo y contraseña que quieras usar.
