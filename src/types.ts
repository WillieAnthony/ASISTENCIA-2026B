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

export type SalonRegistro = {
  id: string
  nombre: string
  creadoEn: string
  asistencias: Asistencia[]
}
