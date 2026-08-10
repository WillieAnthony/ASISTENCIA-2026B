import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { mapSalon } from '../lib/mappers'
import { supabase } from '../lib/supabase'
import type { Asistencia, SalonRegistro } from '../types'

type Teacher = {
  id: string
  correo: string
}

type RegistroContextValue = {
  teacher: Teacher | null
  loading: boolean
  login: (correo: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  salones: SalonRegistro[]
  activeSalonId: string | null
  setActiveSalonId: (id: string | null) => void
  refreshSalones: () => Promise<void>
  generarNuevoRegistro: () => Promise<{
    salon: SalonRegistro | null
    error: string | null
  }>
  agregarAsistencia: (
    salonId: string,
    data: Omit<Asistencia, 'id' | 'registradoEn'>,
  ) => Promise<string | null>
  getSalonPublico: (id: string) => Promise<SalonRegistro | null>
  getSalon: (id: string | undefined) => SalonRegistro | undefined
}

const RegistroContext = createContext<RegistroContextValue | null>(null)

export function RegistroProvider({ children }: { children: ReactNode }) {
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [salones, setSalones] = useState<SalonRegistro[]>([])
  const [activeSalonId, setActiveSalonId] = useState<string | null>(null)

  const refreshSalones = useCallback(async () => {
    const { data, error } = await supabase
      .from('salones')
      .select(
        `
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
      `,
      )
      .order('creado_en', { ascending: false })
      .order('registrado_en', {
        referencedTable: 'asistencias',
        ascending: false,
      })

    if (error) {
      console.error(error)
      return
    }

    const mapped = (data ?? []).map(mapSalon)
    setSalones(mapped)
    setActiveSalonId((current) => {
      if (current && mapped.some((s) => s.id === current)) return current
      return mapped[0]?.id ?? null
    })
  }, [])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      const user = data.session?.user
      if (user?.email) {
        setTeacher({ id: user.id, correo: user.email })
        void refreshSalones()
      }
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user
      if (user?.email) {
        setTeacher({ id: user.id, correo: user.email })
        void refreshSalones()
      } else {
        setTeacher(null)
        setSalones([])
        setActiveSalonId(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [refreshSalones])

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

    if (data.user?.email) {
      setTeacher({ id: data.user.id, correo: data.user.email })
      await refreshSalones()
    }

    return null
  }, [refreshSalones])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setTeacher(null)
    setSalones([])
    setActiveSalonId(null)
  }, [])

  const generarNuevoRegistro = useCallback(async () => {
    if (!teacher) {
      return { salon: null, error: 'Inicia sesión para generar un registro.' }
    }

    const nombre = `Salón ${salones.length + 1}`
    const { data, error } = await supabase
      .from('salones')
      .insert({
        nombre,
        creado_por: teacher.id,
      })
      .select('id, nombre, creado_en')
      .single()

    if (error || !data) {
      console.error(error)
      return {
        salon: null,
        error:
          error?.message ??
          'No se pudo crear el salón. ¿Ya corriste schema.sql?',
      }
    }

    const salon = mapSalon({ ...data, asistencias: [] })
    setSalones((prev) => [salon, ...prev])
    setActiveSalonId(salon.id)
    return { salon, error: null }
  }, [teacher, salones.length])

  const agregarAsistencia = useCallback(
    async (
      salonId: string,
      data: Omit<Asistencia, 'id' | 'registradoEn'>,
    ) => {
      const { error } = await supabase.from('asistencias').insert({
        salon_id: salonId,
        numero_cuenta: data.numeroCuenta,
        nombre: data.nombre,
        apellido_paterno: data.apellidoPaterno,
        apellido_materno: data.apellidoMaterno,
        licenciatura: data.licenciatura,
        semestre: data.semestre,
      })

      if (error) {
        if (error.code === '23505') {
          return 'Este número de cuenta ya registró asistencia.'
        }
        if (error.code === '23503') {
          return 'Este código QR no pertenece a un salón activo.'
        }
        console.error(error)
        return error.message || 'No se pudo enviar el registro.'
      }

      return null
    },
    [],
  )

  const getSalonPublico = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('salones')
      .select('id, nombre, creado_en')
      .eq('id', id)
      .eq('activo', true)
      .maybeSingle()

    if (error || !data) {
      console.error(error)
      return null
    }

    return mapSalon({ ...data, asistencias: [] })
  }, [])

  const getSalon = useCallback(
    (id: string | undefined) => salones.find((s) => s.id === id),
    [salones],
  )

  const value = useMemo<RegistroContextValue>(
    () => ({
      teacher,
      loading,
      login,
      logout,
      salones,
      activeSalonId,
      setActiveSalonId,
      refreshSalones,
      generarNuevoRegistro,
      agregarAsistencia,
      getSalonPublico,
      getSalon,
    }),
    [
      teacher,
      loading,
      login,
      logout,
      salones,
      activeSalonId,
      refreshSalones,
      generarNuevoRegistro,
      agregarAsistencia,
      getSalonPublico,
      getSalon,
    ],
  )

  return (
    <RegistroContext.Provider value={value}>{children}</RegistroContext.Provider>
  )
}

export function useRegistro() {
  const ctx = useContext(RegistroContext)
  if (!ctx) {
    throw new Error('useRegistro debe usarse dentro de RegistroProvider')
  }
  return ctx
}
