# Registro

Aplicación web de registro de asistencias con QR (React + Supabase), publicada en GitHub Pages.

## Desarrollo

1. Copia `.env.example` a `.env.local` y pon tu `VITE_SUPABASE_ANON_KEY`.
2. En Supabase SQL Editor ejecuta `supabase/schema.sql` y `supabase/create_maestro.sql`.
   `schema.sql` es idempotente: vuelve a ejecutarlo cada vez que cambie para aplicar las actualizaciones sin perder datos.
3. Arranca la app:

```bash
npm install
npm run dev
```

## Flujo

1. **Maestro**: inicia sesión (botón “Iniciar sesión”) y entra al panel, que tiene dos apartados:
   - **Generar QR**: escribe el nombre del evento (p. ej. “Programación Web — Grupo 701”) y genera su QR. Puedes ver de nuevo el QR de cualquier evento y descargarlo en PNG para imprimirlo.
   - **Listados**: elige un evento y ve quién se registró con su QR (se actualiza en tiempo real) o descárgalo en Excel.
2. **Alumno**: escanea el QR y abre `/r/:eventoId`. Todos los eventos usan el mismo formulario, que muestra el nombre del evento. La asistencia queda en el listado de ese QR.

Cada QR es un evento independiente: si generas dos QR, cada uno tiene su propio listado.

## Seguridad

- Los alumnos no leen ni escriben tablas directamente: usan las funciones `get_evento_publico` y `registrar_asistencia` (en `schema.sql`), que solo funcionan si se conoce el id exacto del evento.
- Cada maestro solo ve sus propios eventos y asistencias (Row Level Security).

### Acceso maestro

Crea el usuario en Supabase (Authentication o `supabase/create_maestro.sql`) con el correo y la contraseña que quieras usar.
