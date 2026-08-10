import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabaseConfigError =
  !url || !anonKey
    ? 'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Configúralas en GitHub Secrets y vuelve a desplegar.'
    : null

export const supabase: SupabaseClient = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder',
)
