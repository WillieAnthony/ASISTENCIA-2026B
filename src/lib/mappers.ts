import type { Asistencia, SalonRegistro } from '../types'

type AsistenciaRow = {
  id: string
  numero_cuenta: string
  nombre: string
  apellido_paterno: string
  apellido_materno: string
  licenciatura: string
  semestre: number
  registrado_en: string
}

type SalonRow = {
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

export function mapSalon(row: SalonRow): SalonRegistro {
  return {
    id: row.id,
    nombre: row.nombre,
    creadoEn: row.creado_en,
    asistencias: (row.asistencias ?? []).map(mapAsistencia),
  }
}
