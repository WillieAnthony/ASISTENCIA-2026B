import type { Licenciatura } from './data/licenciaturas'

export type Asistencia = {
  id: string
  numeroCuenta: string
  nombre: string
  apellidoPaterno: string
  apellidoMaterno: string
  licenciatura: Licenciatura | string
  semestre: number
  registradoEn: string
}

/** Un QR con nombre. Cada evento tiene su propio listado de asistencias. */
export type Evento = {
  id: string
  nombre: string
  creadoEn: string
  asistencias: Asistencia[]
}

export type NuevaAsistencia = Omit<Asistencia, 'id' | 'registradoEn'>
