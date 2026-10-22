import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  mapAsistencia,
  mapEvento,
  type AsistenciaRow,
  type EventoRow,
} from '../lib/mappers'
import { supabase } from '../lib/supabase'
import type { NuevaAsistencia, Evento } from '../types'
import {
  EVENTO_NOMBRE_MAX,
  isUuid,
  normalizeSpaces,
} from '../utils/validation'
import {
  RegistroContext,
  type RegistroContextValue,
  type Teacher,
} from './registro'

const EVENTOS_SELECT = `
  id,
  nombre,
  creado_en,
  asistencias (
    id,
    numero_cuenta,
    nombre,
    apellido_paterno,
    apellido_materno,
    licenciatura,
    semestre,
    registrado_en
  )
`

export function RegistroProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventos, setEventos] = useState<Evento[]>([])
  const [eventosLoading, setEventosLoading] = useState(false)
  const [eventosError, setEventosError] = useState<string | null>(null)
  const [activeEventoId, setActiveEventoId] = useState<string | null>(null)
  const teacherId = teacher?.id ?? null

  // Solo se actualiza estado aquí: llamar a otros métodos de Supabase dentro
  // de este callback puede bloquear el cliente (lock de auth). La carga de
  // eventos ocurre en el efecto que depende de teacherId.
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      setTeacher((prev) => {
        if (!user?.email) return null
        if (prev?.id === user.id) return prev
        return { id: user.id, correo: user.email }
      })
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const refreshEventos = useCallback(async () => {
    setEventosLoading(true)
    const { data, error } = await supabase
      .from('salones')
      .select(EVENTOS_SELECT)
      .order('creado_en', { ascending: false })
      .order('registrado_en', {
        referencedTable: 'asistencias',
        ascending: false,
      })
    setEventosLoading(false)

    if (error) {
      console.error(error)
      setEventosError('No se pudieron cargar los eventos.')
      return
    }

    const mapped = ((data ?? []) as EventoRow[]).map(mapEvento)
    setEventosError(null)
    setEventos(mapped)
    setActiveEventoId((current) => {
      if (current && mapped.some((e) => e.id === current)) return current
      return mapped[0]?.id ?? null
    })
  }, [])

  useEffect(() => {
    if (!teacherId) {
      setEventos([])
      setActiveEventoId(null)
      setEventosError(null)
      return
    }
    void refreshEventos()
  }, [teacherId, refreshEventos])

  // Tiempo real: las asistencias nuevas aparecen sin pulsar "Actualizar".
  // RLS hace que cada maestro solo reciba las de sus propios eventos.
  useEffect(() => {
    if (!teacherId) return

    const channel = supabase
      .channel(`asistencias-${teacherId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'asistencias' },
        (payload) => {
          const row = payload.new as AsistenciaRow
          const asistencia = mapAsistencia(row)
          setEventos((prev) =>
            prev.map((evento) =>
              evento.id === row.salon_id &&
              !evento.asistencias.some((a) => a.id === asistencia.id)
                ? { ...evento, asistencias: [asistencia, ...evento.asistencias] }
                : evento,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [teacherId])

  const login = useCallback(async (correo: string, password: string) => {
    const trimmed = correo.trim()
    if (!trimmed || !password) return 'Ingresa correo y contraseña.'
    if (!trimmed.includes('@')) return 'El correo no es válido.'

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmed,
      password,
    })

    if (error) {
      return 'Correo o contraseña incorrectos.'
    }

    const user = data.user
    if (user?.email) {
      setTeacher((prev) =>
        prev?.id === user.id ? prev : { id: user.id, correo: user.email! },
      )
    }
    return null
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setTeacher(null)
  }, [])

  const crearEvento = useCallback(
    async (nombreRaw: string) => {
      if (!teacher) {
        return { evento: null, error: 'Inicia sesión para generar un QR.' }
      }

      const nombre = normalizeSpaces(nombreRaw)
      if (!nombre) {
        return { evento: null, error: 'Escribe el nombre del evento.' }
      }
      if (nombre.length > EVENTO_NOMBRE_MAX) {
        return {
          evento: null,
          error: `El nombre no puede pasar de ${EVENTO_NOMBRE_MAX} caracteres.`,
        }
      }
      const repetido = eventos.some(
        (e) => e.nombre.toLocaleLowerCase('es') === nombre.toLocaleLowerCase('es'),
      )
      if (repetido) {
        return {
          evento: null,
          error: 'Ya tienes un evento con ese nombre. Usa uno distinto.',
        }
      }

      const { data, error } = await supabase
        .from('salones')
        .insert({ nombre, creado_por: teacher.id })
        .select('id, nombre, creado_en')
        .single()

      if (error || !data) {
        console.error(error)
        return {
          evento: null,
          error: 'No se pudo crear el evento. Intenta de nuevo.',
        }
      }

      const evento = mapEvento({ ...data, asistencias: [] })
      setEventos((prev) => [evento, ...prev])
      setActiveEventoId(evento.id)
      return { evento, error: null }
    },
    [teacher, eventos],
  )

  const registrarAsistencia = useCallback(
    async (eventoId: string, data: NuevaAsistencia) => {
      const { error } = await supabase.rpc('registrar_asistencia', {
        p_salon_id: eventoId,
        p_numero_cuenta: data.numeroCuenta,
        p_nombre: data.nombre,
        p_apellido_paterno: data.apellidoPaterno,
        p_apellido_materno: data.apellidoMaterno,
        p_licenciatura: data.licenciatura,
        p_semestre: data.semestre,
      })

      if (!error) return null

      switch (error.code) {
        case '23505':
          return 'Este número de cuenta ya registró asistencia en este evento.'
        case 'P0002':
          return 'Este código QR ya no pertenece a un evento disponible.'
        case '22023':
          return 'Selecciona una licenciatura válida.'
        case '23514':
          return 'Revisa tus datos: hay caracteres no permitidos.'
        default:
          console.error(error)
          return 'No se pudo enviar el registro. Revisa tu conexión e intenta de nuevo.'
      }
    },
    [],
  )

  const getEventoPublico = useCallback(async (id: string) => {
    if (!isUuid(id)) return { evento: null, error: null }

    const { data, error } = await supabase
      .rpc('get_evento_publico', { p_id: id })
      .maybeSingle<Omit<EventoRow, 'asistencias'>>()

    if (error) {
      console.error(error)
      return { evento: null, error: 'No se pudo cargar el evento.' }
    }
    if (!data) return { evento: null, error: null }

    return { evento: mapEvento({ ...data, asistencias: [] }), error: null }
  }, [])

  const value = useMemo<RegistroContextValue>(
    () => ({
      teacher,
      loading,
      login,
      logout,
      eventos,
      eventosLoading,
      eventosError,
      activeEventoId,
      setActiveEventoId,
      refreshEventos,
      crearEvento,
      registrarAsistencia,
      getEventoPublico,
    }),
    [
      teacher,
      loading,
      login,
      logout,
      eventos,
      eventosLoading,
      eventosError,
      activeEventoId,
      refreshEventos,
      crearEvento,
      registrarAsistencia,
      getEventoPublico,
    ],
  )

  return (
    <RegistroContext.Provider value={value}>{children}</RegistroContext.Provider>
  )
}
