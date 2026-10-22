import type { Asistencia, Evento } from '../types'

export type AsistenciaRow = {
  id: string
  salon_id?: string
  numero_cuenta: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  licenciatura: string
  semestre: number
  registrado_en: string
}

export type EventoRow = {
  id: string
  nombre: string
  creado_en: string
  asistencias?: AsistenciaRow[] | null
}

export function mapAsistencia(row: AsistenciaRow): Asistencia {
  return {
    id: row.id,
    numeroCuenta: row.numero_cuenta,
    nombre: row.nombre,
    apellidoPaterno: row.apellido_paterno,
    apellidoMaterno: row.apellido_materno,
    licenciatura: row.licenciatura,
    semestre: row.semestre,
    registradoEn: row.registrado_en,
  }
}

export function mapEvento(row: EventoRow): Evento {
  return {
    id: row.id,
    nombre: row.nombre,
    creadoEn: row.creado_en,
    asistencias: (row.asistencias ?? []).map(mapAsistencia),
  }
}
