import { createContext, useContext } from 'react'
import type { Evento, NuevaAsistencia } from '../types'

export type Teacher = {
  id: string
  correo: string
}

export type RegistroContextValue = {
  teacher: Teacher | null
  loading: boolean
  login: (correo: string, password: string) => Promise<string | null>
  logout: () => Promise<void>
  eventos: Evento[]
  eventosLoading: boolean
  eventosError: string | null
  activeEventoId: string | null
  setActiveEventoId: (id: string | null) => void
  refreshEventos: () => Promise<void>
  crearEvento: (
    nombre: string,
  ) => Promise<{ evento: Evento | null; error: string | null }>
  registrarAsistencia: (
    eventoId: string,
    data: NuevaAsistencia,
  ) => Promise<string | null>
  getEventoPublico: (
    id: string,
  ) => Promise<{ evento: Evento | null; error: string | null }>
}

export const RegistroContext = createContext<RegistroContextValue | null>(null)

export function useRegistro() {
  const ctx = useContext(RegistroContext)
  if (!ctx) {
    throw new Error('useRegistro debe usarse dentro de RegistroProvider')
  }
  return ctx
}
